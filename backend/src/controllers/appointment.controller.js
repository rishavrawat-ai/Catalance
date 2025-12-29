import { asyncHandler } from "../utils/async-handler.js";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/app-error.js";
import { sendNotificationToUser } from "../lib/notification-util.js";

// Helper to parse date string "YYYY-MM-DD" properly to avoid timezone issues
const parseDate = (dateStr, isEndOfDay = false) => {
    if (!dateStr) return null;
    const [year, month, day] = dateStr.split("-").map(Number);
    // Use noon to avoid DST issues, but for end of range use end of day
    if (isEndOfDay) {
        return new Date(year, month - 1, day, 23, 59, 59, 999);
    }
    return new Date(year, month - 1, day, 0, 0, 0, 0);
};

// ==================== MANAGER AVAILABILITY ====================

/**
 * Get manager's availability for a specific date range
 */
export const getManagerAvailability = asyncHandler(async (req, res) => {
    const { managerId, startDate, endDate } = req.query;

    if (!managerId) {
        throw new AppError("Manager ID is required", 400);
    }

    const where = {
        managerId,
    };

    if (startDate && endDate) {
        where.date = {
            gte: parseDate(startDate, false),
            lte: parseDate(endDate, true),
        };
    } else if (startDate) {
        where.date = {
            gte: parseDate(startDate, false),
        };
    }

    const availability = await prisma.managerAvailability.findMany({
        where,
        orderBy: [{ date: "asc" }, { startHour: "asc" }],
        include: {
            manager: {
                select: { id: true, fullName: true, email: true },
            },
        },
    });

    res.json({ data: availability });
});

/**
 * Set manager's availability slots
 * Body: { date: string, slots: [{startHour: number, endHour: number}] }
 */
export const setManagerAvailability = asyncHandler(async (req, res) => {
    const userId = req.user?.sub;
    if (!userId) throw new AppError("Authentication required", 401);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || (user.role !== "PROJECT_MANAGER" && user.role !== "ADMIN")) {
        throw new AppError("Only managers can set availability", 403);
    }

    const { date, slots } = req.body;

    if (!date || !Array.isArray(slots)) {
        throw new AppError("Date and slots array are required", 400);
    }

    // Use parseDate helper (noon time to avoid timezone issues)
    const dateObj = parseDate(date, false);
    dateObj.setHours(12, 0, 0, 0); // Ensure noon for consistency

    // Delete existing availability for this date
    await prisma.managerAvailability.deleteMany({
        where: {
            managerId: userId,
            date: dateObj,
            isBooked: false, // Only delete unbooked slots
        },
    });

    // Create new slots
    const createdSlots = [];
    for (const slot of slots) {
        const { startHour, endHour } = slot;

        if (startHour < 0 || startHour > 23 || endHour < 0 || endHour > 24) {
            continue;
        }

        try {
            const created = await prisma.managerAvailability.create({
                data: {
                    managerId: userId,
                    date: dateObj,
                    startHour,
                    endHour,
                    isBooked: false,
                },
            });
            createdSlots.push(created);
        } catch (e) {
            // Ignore duplicate errors (slot already booked)
            if (e.code !== "P2002") throw e;
        }
    }

    res.status(201).json({ data: createdSlots });
});

/**
 * Delete a specific availability slot
 */
export const deleteAvailabilitySlot = asyncHandler(async (req, res) => {
    const userId = req.user?.sub;
    const { id } = req.params;

    if (!userId) throw new AppError("Authentication required", 401);

    const slot = await prisma.managerAvailability.findUnique({
        where: { id },
    });

    if (!slot) throw new AppError("Slot not found", 404);
    if (slot.managerId !== userId) throw new AppError("Access denied", 403);
    if (slot.isBooked) throw new AppError("Cannot delete a booked slot", 400);

    await prisma.managerAvailability.delete({ where: { id } });

    res.json({ message: "Slot deleted successfully" });
});

// ==================== APPOINTMENTS ====================

/**
 * Get available slots for booking (for freelancers/clients)
 */
export const getAvailableSlots = asyncHandler(async (req, res) => {
    const { managerId, date } = req.query;

    if (!managerId || !date) {
        throw new AppError("Manager ID and date are required", 400);
    }

    const dateObj = parseDate(date, false);

    const availableSlots = await prisma.managerAvailability.findMany({
        where: {
            managerId,
            date: dateObj,
            isBooked: false,
        },
        orderBy: { startHour: "asc" },
        include: {
            manager: {
                select: { id: true, fullName: true, email: true },
            },
        },
    });

    res.json({ data: availableSlots });
});

/**
 * Book an appointment (for freelancers/clients)
 */
export const bookAppointment = asyncHandler(async (req, res) => {
    const userId = req.user?.sub;
    if (!userId) throw new AppError("Authentication required", 401);

    const { managerId, date, startHour, endHour, title, description, projectId } = req.body;

    if (!managerId || !date || startHour === undefined || endHour === undefined || !title) {
        throw new AppError("Manager ID, date, time slot, and title are required", 400);
    }

    const dateObj = parseDate(date, false);

    // Check if the slot exists and is available
    const slot = await prisma.managerAvailability.findFirst({
        where: {
            managerId,
            date: dateObj,
            startHour,
            isBooked: false,
        },
    });

    if (!slot) {
        throw new AppError("This time slot is not available", 400);
    }

    // Get booker info for the title
    const booker = await prisma.user.findUnique({
        where: { id: userId },
        select: { fullName: true, role: true },
    });

    // Create appointment with pending status
    const appointment = await prisma.appointment.create({
        data: {
            title: `${title} (${booker.role === 'CLIENT' ? 'Client' : 'Freelancer'}: ${booker.fullName})`,
            description,
            date: dateObj,
            startHour,
            endHour,
            bookedById: userId,
            managerId,
            projectId: projectId || null,
            status: "PENDING",
        },
        include: {
            bookedBy: {
                select: { id: true, fullName: true, email: true, role: true },
            },
            manager: {
                select: { id: true, fullName: true, email: true },
            },
            project: {
                select: { id: true, title: true },
            },
        },
    });

    // Mark the slot as booked
    await prisma.managerAvailability.update({
        where: { id: slot.id },
        data: { isBooked: true },
    });

    // Send notification to the manager
    try {
        await sendNotificationToUser(managerId, {
            type: "appointment",
            title: "New Appointment Request",
            message: `New appointment booked by ${booker.fullName} (${booker.role}) for ${dateObj.toLocaleDateString()}`,
            data: {
                appointmentId: appointment.id,
                projectId: projectId || null,
                date: dateObj.toISOString()
            }
        });
    } catch (error) {
        console.error("Failed to send appointment notification:", error);
    }

    res.status(201).json({ data: appointment });
});

/**
 * Get appointments (filtered by role)
 */
export const getAppointments = asyncHandler(async (req, res) => {
    const userId = req.user?.sub;
    if (!userId) throw new AppError("Authentication required", 401);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError("User not found", 401);

    let where = {};

    if (user.role === "PROJECT_MANAGER" || user.role === "ADMIN") {
        // Managers see appointments assigned to them
        where.managerId = userId;
    } else {
        // Freelancers/Clients see their own bookings
        where.bookedById = userId;
    }

    const { status, startDate, endDate } = req.query;

    if (status) {
        where.status = status;
    }

    if (startDate && endDate) {
        where.date = {
            gte: new Date(startDate),
            lte: new Date(endDate),
        };
    }

    const appointments = await prisma.appointment.findMany({
        where,
        orderBy: [{ date: "asc" }, { startHour: "asc" }],
        include: {
            bookedBy: {
                select: { id: true, fullName: true, email: true, role: true },
            },
            manager: {
                select: { id: true, fullName: true, email: true },
            },
            project: {
                select: { id: true, title: true },
            },
        },
    });

    res.json({ data: appointments });
});

/**
 * Approve or reject an appointment (for managers)
 */
export const updateAppointmentStatus = asyncHandler(async (req, res) => {
    const userId = req.user?.sub;
    const { id } = req.params;
    const { status, meetingLink } = req.body;

    if (!userId) throw new AppError("Authentication required", 401);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || (user.role !== "PROJECT_MANAGER" && user.role !== "ADMIN")) {
        throw new AppError("Only managers can update appointment status", 403);
    }

    const appointment = await prisma.appointment.findUnique({
        where: { id },
        include: {
            bookedBy: true,
            manager: true,
        },
    });

    if (!appointment) throw new AppError("Appointment not found", 404);
    if (appointment.managerId !== userId) throw new AppError("Access denied", 403);

    const updateData = {};

    if (status) {
        if (!["APPROVED", "REJECTED", "CANCELLED"].includes(status)) {
            throw new AppError("Invalid status", 400);
        }
        updateData.status = status;

        // If rejected/cancelled, free up the slot
        if (status === "REJECTED" || status === "CANCELLED") {
            await prisma.managerAvailability.updateMany({
                where: {
                    managerId: appointment.managerId,
                    date: appointment.date,
                    startHour: appointment.startHour,
                },
                data: { isBooked: false },
            });
        }
    }

    if (meetingLink) {
        updateData.meetingLink = meetingLink;
    }

    // Auto-generate meeting link if approving without one
    if (status === "APPROVED" && !appointment.meetingLink && !meetingLink) {
        updateData.meetingLink = `https://meet.jit.si/Catalance-Meeting-${id}`;
    }

    const updated = await prisma.appointment.update({
        where: { id },
        data: updateData,
        include: {
            bookedBy: {
                select: { id: true, fullName: true, email: true, role: true },
            },
            manager: {
                select: { id: true, fullName: true, email: true },
            },
            project: {
                select: { id: true, title: true },
            },
        },
    });

    res.json({ data: updated });
});

/**
 * Cancel an appointment (by the booker)
 */
export const cancelAppointment = asyncHandler(async (req, res) => {
    const userId = req.user?.sub;
    const { id } = req.params;

    if (!userId) throw new AppError("Authentication required", 401);

    const appointment = await prisma.appointment.findUnique({
        where: { id },
    });

    if (!appointment) throw new AppError("Appointment not found", 404);
    if (appointment.bookedById !== userId) throw new AppError("Access denied", 403);
    if (appointment.status !== "PENDING") {
        throw new AppError("Can only cancel pending appointments", 400);
    }

    // Free up the slot
    await prisma.managerAvailability.updateMany({
        where: {
            managerId: appointment.managerId,
            date: appointment.date,
            startHour: appointment.startHour,
        },
        data: { isBooked: false },
    });

    await prisma.appointment.update({
        where: { id },
        data: { status: "CANCELLED" },
    });

    res.json({ message: "Appointment cancelled successfully" });
});

/**
 * Get all managers (for booking dropdown)
 */
export const getManagers = asyncHandler(async (req, res) => {
    const managers = await prisma.user.findMany({
        where: {
            role: "PROJECT_MANAGER",
            status: "ACTIVE",
        },
        select: {
            id: true,
            fullName: true,
            email: true,
        },
    });

    res.json({ data: managers });
});
