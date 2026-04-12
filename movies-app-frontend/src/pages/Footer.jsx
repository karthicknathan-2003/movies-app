import React from "react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function Footer() {
    const year = new Date().getFullYear();
    const authorName = import.meta.env.VITE_AUTHOR_NAME || "the developer";

    return (
        <footer className="bg-white dark:bg-black text-black dark:text-white">
            <Separator className="bg-gray-200 dark:bg-[#232223]" />
            <div className="max-w-6xl mx-auto px-6 py-8">

                {/* Top row — brand, tagline, and API badge. */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div>
                        <h2 className="text-xl font-bold">Cine Vault</h2>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            Your personal movie & TV show companion.
                        </p>
                    </div>

                    {/* TMDB API badge — links to TMDB as required by their API terms. */}
                    <Button
                        variant="secondary"
                        size="sm"
                        className="w-fit bg-gray-200 dark:bg-[#232223] hover:bg-gray-300 dark:hover:bg-[#2f2f2f] text-black dark:text-white"
                        asChild
                    >
                        <a
                            href="https://www.themoviedb.org/"
                            target="_blank"
                            rel="noreferrer"
                        >
                            {/* TMDB brand color dot indicator. */}
                            <span className="w-2 h-2 rounded-full bg-[#01b4e4] shrink-0" />
                            Powered by TMDB API
                        </a>
                    </Button>
                </div>

                <Separator className="bg-gray-200 dark:bg-[#232223] mb-6" />

                {/* Bottom row — copyright and developer credit. */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <Badge
                            variant="outline"
                            className="text-xs border-gray-300 dark:border-[#232223] text-black dark:text-white"
                        >
                            © {year} Cine Vault
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                            All rights reserved.
                        </span>
                    </div>

                    {/* Developer credit. */}
                    <p className="text-sm text-muted-foreground">
                        Designed & developed by{" "}
                        <Button
                            variant="link"
                            size="sm"
                            className="p-0 h-auto text-black dark:text-white font-medium underline-offset-2"
                            asChild
                        >
                            <a
                                href="https://github.com/karthicknathan-2003"
                                target="_blank"
                                rel="noreferrer"
                            >
                                {authorName}
                            </a>
                        </Button>
                    </p>
                </div>

            </div>
        </footer>
    );
}