"use client"

import { useEffect, useState } from "react"
import { motion, useMotionTemplate, useMotionValue } from "motion/react"
import PropTypes from "prop-types"

import { cn } from "@/lib/utils"

export const EvervaultCard = ({ text, className, children, disableEffect = false }) => {
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const [randomString, setRandomString] = useState("")

  useEffect(() => {
    const str = generateRandomString(1500)
    setRandomString(str)
  }, [])

  function onMouseMove({ currentTarget, clientX, clientY }) {
    const { left, top } = currentTarget.getBoundingClientRect()
    mouseX.set(clientX - left)
    mouseY.set(clientY - top)

    const str = generateRandomString(1500)
    setRandomString(str)
  }

  const cardStyle = {
    background: "var(--client-card-bg)",
  }

  const textStyle = {
    color: "var(--client-card-text)",
  }

  return (
    <div
      className={cn(
        "relative h-full w-full rounded-[30px] bg-gradient-to-br from-yellow-400/50 via-amber-500/40 to-orange-500/50 p-[2px]",
        className,
      )}
    >
      <div
        onMouseMove={onMouseMove}
        className="group/card relative flex h-full w-full items-center justify-center overflow-hidden rounded-[26px]"
        style={cardStyle}
      >
        {!disableEffect && <CardPattern mouseX={mouseX} mouseY={mouseY} randomString={randomString} />}
        <div
          className="relative z-10 flex h-full w-full items-center justify-center px-6 text-center"
          style={textStyle}
        >
          {children ? (
            children
          ) : (
            <div className="relative flex h-40 w-40 items-center justify-center rounded-full text-3xl font-bold">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-200/70 via-amber-400/60 to-orange-500/60 blur-md" />
              <span className="relative z-10 text-black">{text}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function CardPattern({ mouseX, mouseY, randomString }) {
  const maskImage = useMotionTemplate`radial-gradient(250px at ${mouseX}px ${mouseY}px, white, transparent)`
  const style = { maskImage, WebkitMaskImage: maskImage }

  return (
    <div className="pointer-events-none">
      <div className="absolute inset-0 rounded-2xl [mask-image:linear-gradient(white,transparent)] group-hover/card:opacity-50" />
      <motion.div
        className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary to-orange-700 opacity-0 transition duration-500 backdrop-blur-xl group-hover/card:opacity-100"
        style={style}
      />
      <motion.div
        className="absolute inset-0 rounded-2xl opacity-0 mix-blend-overlay transition duration-500 group-hover/card:opacity-100"
        style={style}
      >
        <p className="absolute inset-x-0 h-full break-words whitespace-pre-wrap text-xs font-mono font-bold text-white transition duration-500">
          {randomString}
        </p>
      </motion.div>
    </div>
  )
}

const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"

export const generateRandomString = (length) => {
  let result = ""
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return result
}

export const Icon = ({ className, ...rest }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="1.5"
      stroke="currentColor"
      className={className}
      {...rest}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
    </svg>
  )
}

EvervaultCard.propTypes = {
  text: PropTypes.string,
  className: PropTypes.string,
  children: PropTypes.node,
}

CardPattern.propTypes = {
  mouseX: PropTypes.object.isRequired,
  mouseY: PropTypes.object.isRequired,
  randomString: PropTypes.string.isRequired,
}

Icon.propTypes = {
  className: PropTypes.string,
}
