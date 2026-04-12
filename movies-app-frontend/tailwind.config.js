/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,jsx}"
    ],
    theme: {
        extend: {
            colors: {
                bgDark: "#0b0f19",
                cardDark: "#121829",
                accent: "#4f46e5",
            },
        },
    },
    plugins: [],
};
