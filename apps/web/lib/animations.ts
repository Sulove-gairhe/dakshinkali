export const loginCardMotion = {
  initial: { opacity: 0, y: 24, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1 },
  transition: {
    duration: 0.4,
    ease: [0.34, 1.56, 0.64, 1],
  },
} as const;

export const staggerSectionMotion = (delay: number) =>
  ({
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.28, delay, ease: [0.22, 1, 0.36, 1] },
  }) as const;

export const eyeClickMotion = {
  animate: { rotate: [0, -15, 15, 0] as number[], scale: [1, 1.3, 1.3, 1] as number[] },
  transition: { duration: 0.35 },
} as const;
