// lib/animations.ts
// YourStore — Shared Framer Motion Variants
// Import from here in every component that needs animation

import type { Variants } from 'framer-motion'

// ---- Easing Curves ----
export const spring = [0.34, 1.56, 0.64, 1] as const   // springy overshoot (buttons, cards)
export const easeOut = [0.0, 0.0, 0.2, 1] as const     // smooth settle (sections, modals)
export const easeInOut = [0.4, 0, 0.2, 1] as const     // standard (drawers, transitions)

// ---- Page / Section Variants ----

/** Fade up — use on page sections, heroes, text blocks */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: easeOut },
  },
}

/** Fade in — simple opacity, no movement */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.35, ease: easeOut },
  },
}

/** Scale in — use on cards, badges, modals appearing */
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3, ease: spring },
  },
}

/** Slide in from right — use on cart drawer, side panels */
export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 60 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.35, ease: easeOut },
  },
  exit: {
    opacity: 0,
    x: 60,
    transition: { duration: 0.25, ease: easeInOut },
  },
}

/** Slide in from bottom — use on mobile drawers, toasts */
export const slideInBottom: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: easeOut },
  },
  exit: {
    opacity: 0,
    y: 40,
    transition: { duration: 0.25, ease: easeInOut },
  },
}

// ---- Grid / List Stagger ----

/** Container — wrap product grids or lists with this */
export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.1,
    },
  },
}

/** Child item for staggered grids — pair with staggerContainer */
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.35, ease: easeOut },
  },
}

// ---- Interactive States ----

/** Standard button interaction */
export const buttonMotion = {
  whileHover: { scale: 1.04 },
  whileTap: { scale: 0.96 },
  transition: { type: 'spring', stiffness: 400, damping: 17 },
}

/** Card hover lift */
export const cardMotion = {
  whileHover: { y: -4, transition: { duration: 0.2, ease: easeOut } },
}

/** Icon bounce — use on cart icon when item added */
export const iconBounce = {
  animate: {
    scale: [1, 1.3, 0.9, 1.1, 1],
    transition: { duration: 0.5, ease: spring },
  },
}

// ---- Modal / Dialog ----

export const modalBackdrop: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
}

export const modalContent: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.3, ease: spring },
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    y: 6,
    transition: { duration: 0.2, ease: easeInOut },
  },
}
