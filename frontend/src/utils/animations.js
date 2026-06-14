// Framer Motion animation variants - reusable across components

export const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1, y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] }
  }
};

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4, ease: 'easeOut' } }
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: {
    opacity: 1, scale: 1,
    transition: { duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }
  }
};

export const slideInRight = {
  hidden: { opacity: 0, x: 60 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } }
};

export const slideInLeft = {
  hidden: { opacity: 0, x: -60 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } }
};

export const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.1 }
  }
};

export const staggerItem = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1, y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] }
  }
};

export const cardHover = {
  rest: { y: 0, boxShadow: '0 4px 16px rgba(0,0,0,0.10)' },
  hover: {
    y: -6,
    boxShadow: '0 16px 40px rgba(0,0,0,0.18)',
    transition: { duration: 0.3, ease: 'easeOut' }
  }
};

export const buttonTap = {
  rest: { scale: 1 },
  hover: { scale: 1.02 },
  tap: { scale: 0.97 },
};

export const drawerVariants = {
  closed: { x: '100%', opacity: 0 },
  open: {
    x: 0, opacity: 1,
    transition: { type: 'spring', damping: 28, stiffness: 300 }
  },
  exit: {
    x: '100%', opacity: 0,
    transition: { duration: 0.2, ease: 'easeIn' }
  }
};

export const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25 } },
  exit: { opacity: 0, transition: { duration: 0.2 } }
};

export const modalVariants = {
  hidden: { opacity: 0, scale: 0.94, y: 20 },
  visible: {
    opacity: 1, scale: 1, y: 0,
    transition: { type: 'spring', damping: 28, stiffness: 350 }
  },
  exit: {
    opacity: 0, scale: 0.94, y: 20,
    transition: { duration: 0.18, ease: 'easeIn' }
  }
};

export const pageTransition = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, y: -16, transition: { duration: 0.25, ease: 'easeIn' } }
};

export const heroTextVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.2 } }
};

export const heroLineVariant = {
  hidden: { opacity: 0, y: 40, skewY: 2 },
  visible: {
    opacity: 1, y: 0, skewY: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] }
  }
};

export const counterVariant = (final) => ({
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } }
});

export const heartPop = {
  rest: { scale: 1 },
  pop: { scale: [1, 1.4, 0.9, 1.15, 1], transition: { duration: 0.4, ease: 'easeInOut' } }
};

export const badgeBounce = {
  rest: { scale: 1 },
  bounce: {
    scale: [1, 1.35, 0.85, 1.1, 1],
    transition: { duration: 0.45, ease: 'easeInOut' }
  }
};

export const toastVariants = {
  hidden: { opacity: 0, y: 48, scale: 0.9 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { type: 'spring', damping: 22, stiffness: 360 }
  },
  exit: {
    opacity: 0, y: 16, scale: 0.95,
    transition: { duration: 0.18 }
  }
};

export const parallaxOffset = (scrollY, speed = 0.3) => ({
  y: scrollY * speed
});
