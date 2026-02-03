import { Variants } from "framer-motion";

export const pageVariants = {
    hidden: {
        opacity: 0,
        y: 30,
        scale: 0.98,
    },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            duration: 0.8,
            ease: [0.25, 0.46, 0.45, 0.94] as const,
            staggerChildren: 0.1,
            delayChildren: 0.1,
        },
    },
};


export const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.6,
            ease: [0.25, 0.46, 0.45, 0.94] as const,
            staggerChildren: 0.08,
            delayChildren: 0.2,
        },
    },
};

export const titleVariants = {
    hidden: { opacity: 0, x: -30, scale: 0.9 },
    visible: {
        opacity: 1,
        x: 0,
        scale: 1,
        transition: {
            duration: 0.7,
            ease: [0.25, 0.46, 0.45, 0.94] as const,
        },
    },
};


export const tabContainerVariants = {
    hidden: { opacity: 0, x: 30, scale: 0.95 },
    visible: {
        opacity: 1,
        x: 0,
        scale: 1,
        transition: {
            duration: 0.6,
            ease: [0.25, 0.46, 0.45, 0.94] as const,
            delay: 0.3,
        },
    },
};


export const tabContentVariants = {
    hidden: {
        opacity: 0,
        x: 40,
        scale: 0.95,
        filter: "blur(8px)",
    },
    visible: {
        opacity: 1,
        x: 0,
        scale: 1,
        filter: "blur(0px)",
        transition: {
            duration: 0.5,
            ease: [0.25, 0.46, 0.45, 0.94] as const,
            staggerChildren: 0.1,
        },
    },
    exit: {
        opacity: 0,
        x: -40,
        scale: 0.95,
        filter: "blur(8px)",
        transition: {
            duration: 0.3,
            ease: [0.25, 0.46, 0.45, 0.94] as const,
        },
    },
};

export const tableVariants = {
    hidden: {
        opacity: 0,
        scale: 0.95,
        y: 20,
    },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: {
            duration: 0.6,
            ease: [0.25, 0.46, 0.45, 0.94] as const,
            staggerChildren: 0.06,
            delayChildren: 0.3,
        },
    },
} satisfies Variants;

export const headerVariants = {
    hidden: {
        opacity: 0,
        y: -15,
        scale: 0.95,
    },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            duration: 0.5,
            ease: [0.25, 0.46, 0.45, 0.94] as const,
        },
    },
} satisfies Variants;

export const rowVariants: Variants = {
    hidden: {
        opacity: 0,
        y: 15,
        scale: 0.98,
        filter: "blur(2px)",
    },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        filter: "blur(0px)",
        transition: {
            duration: 0.4,
            ease: [0.25, 0.46, 0.45, 0.94] as const,
        },
    },
    exit: {
        opacity: 0,
        y: -10,
        scale: 0.95,
        filter: "blur(2px)",
        transition: {
            duration: 0.3,
            ease: [0.25, 0.46, 0.45, 0.94] as const,
        },
    },
};

export const containerVariantsClients: Variants = {
    hidden: {
        opacity: 0,
        y: 30,
        scale: 0.98,
        filter: "blur(5px)",
    },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        filter: "blur(0px)",
        transition: {
            duration: 0.7,
            ease: [0.25, 0.46, 0.45, 0.94] as const,
            staggerChildren: 0.1,
            delayChildren: 0.1,
        },
    },
};