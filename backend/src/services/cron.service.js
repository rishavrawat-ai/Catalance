import cron from 'node-cron';
import { prisma } from '../lib/prisma.js';
import { Resend } from 'resend';
import { env } from '../config/env.js';

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

export const startCronJobs = () => {
    console.log('Starting cron jobs...');

    // Run every minute
    cron.schedule('* * * * *', async () => {
        try {
            const now = new Date();
            // Look for meetings in the upcoming window covering ~10 minutes
            // We'll check for meetings starting between 9 and 11 minutes from now
            // to catch the "10 minutes before" mark.
            const startWindow = new Date(now.getTime() + 9 * 60000);
            const endWindow = new Date(now.getTime() + 11 * 60000);

            const disputes = await prisma.dispute.findMany({
                where: {
                    status: { not: 'RESOLVED' },
                    meetingDate: {
                        gte: startWindow,
                        lte: endWindow
                    },
                    meetingReminderSent: false
                },
                include: {
                    project: {
                        include: {
                            owner: true,
                            proposals: {
                                where: { status: 'ACCEPTED' },
                                include: { freelancer: true }
                            }
                        }
                    },
                    raisedBy: true
                }
            });

            if (disputes.length > 0) {
                console.log(`Found ${disputes.length} disputes for meeting reminders.`);
            }

            for (const dispute of disputes) {
                let link = dispute.meetingLink;

                // Auto-generate Jitsi link if missing
                if (!link) {
                    link = `https://meet.jit.si/Catalance-Dispute-${dispute.id}`;
                    // Save the generated link
                    await prisma.dispute.update({
                        where: { id: dispute.id },
                        data: { meetingLink: link }
                    });
                    console.log(`Generated auto-link for dispute ${dispute.id}: ${link}`);
                }

                // Identify recipients
                const recipients = [];
                // Client (Project Owner)
                if (dispute.project.owner?.email) recipients.push(dispute.project.owner.email);

                // Freelancer (from accepted proposal)
                const freelancer = dispute.project.proposals?.[0]?.freelancer;
                if (freelancer?.email && !recipients.includes(freelancer.email)) {
                    recipients.push(freelancer.email);
                }

                if (recipients.length === 0) {
                    console.log(`No recipients found for dispute ${dispute.id}`);
                    continue;
                }

                // Send email
                if (resend) {
                    await resend.emails.send({
                        from: env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
                        to: recipients,
                        subject: `Meeting Reminder: ${dispute.project.title}`,
                        html: `
                            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                                <h2>Meeting Reminder</h2>
                                <p>This is a reminder that your dispute resolution meeting for <strong>${dispute.project.title}</strong> is scheduled to start in approximately 10 minutes.</p>
                                
                                <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0;">
                                    <p style="margin: 0; font-weight: bold;">Time: ${new Date(dispute.meetingDate).toLocaleString()}</p>
                                    <p style="margin: 10px 0 0 0;">
                                        <strong>Link:</strong> <a href="${link}" style="color: #2563eb;">Join Meeting</a>
                                    </p>
                                    <p style="font-size: 12px; color: #6b7280; margin-top: 5px;">${link}</p>
                                </div>
                                
                                <p>Please join on time to resolve the issue promptly.</p>
                            </div>
                        `
                    });
                    console.log(`Sent meeting reminder emails to: ${recipients.join(', ')}`);
                } else {
                    console.log(`[Mock Email] To: ${recipients.join(', ')}`);
                    console.log(`Subject: Meeting Reminder: ${dispute.project.title}`);
                    console.log(`Link: ${link}`);
                }

                // Update status to prevent duplicate sending
                await prisma.dispute.update({
                    where: { id: dispute.id },
                    data: { meetingReminderSent: true }
                });
            }
        } catch (error) {
            console.error('Error in meeting reminder cron:', error);
        }
    });
};
