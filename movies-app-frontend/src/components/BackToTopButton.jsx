import { useEffect, useState } from "react";
import { FaArrowUp } from "react-icons/fa";

export default function BackToTopButton() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setVisible(window.scrollY > 500);
        };

        handleScroll();
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    if (!visible) return null;

    return (
        <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="fixed bottom-20 right-4 z-50 flex h-11 w-11 items-center justify-center rounded-full
                bg-black text-white shadow-lg transition hover:bg-black/85 dark:bg-white dark:text-black dark:hover:bg-white/85 md:bottom-6"
            aria-label="Back to top"
        >
            <FaArrowUp size={14} />
        </button>
    );
}
