"use client";

import { Linkedin, Twitter, Instagram, X } from "lucide-react";

export const Footer = () => {
  const developers = [
    {
      name: "Iftekhar Ahemad",
      linkedin: "",
      twitter: "",
      instagram: "",
    },
    {},
  ];

  return (
    <footer className="border-t border-border bg-background text-foreground py-12">
      <div className="flex flex-col justify-center items-center gap-4 max-w-6xl mx-auto px-6">
        <h1 className="font-semibold tracking-widest text-xl ">
          DEVELOPED WITH ❤️{" "}
        </h1>
        <div className="mb-10">
          <div className="flex flex-wrap justify-center gap-8 lg:gap-12">
            {developers.map((dev, index) => (
              <div
                key={index}
                className="border border-border bg-card text-card-foreground shadow-sm rounded-xl p-6 hover:shadow-md transition-all duration-300 group hover:-translate-y-1"
              >
                <h4 className="text-card-foreground font-semibold text-lg mb-4 tracking-wide group-hover:scale-105 transition-transform duration-300">
                  {dev.name}
                </h4>
                <div className="flex space-x-4 justify-center">
                  <a
                    href={dev.linkedin}
                    className="text-muted-foreground hover:text-primary p-2 rounded-lg hover:bg-accent transition-all duration-300 transform hover:scale-110"
                    aria-label={`${dev.name} LinkedIn`}
                  >
                    <Linkedin size={20} />
                  </a>
                  <a
                    href={dev.twitter}
                    className="text-muted-foreground hover:text-primary p-2 rounded-lg hover:bg-accent transition-all duration-300 transform hover:scale-110"
                    aria-label={`${dev.name} Twitter`}
                  >
                    <Twitter size={20} />
                  </a>
                  <a
                    href={dev.instagram}
                    className="text-muted-foreground hover:text-destructive p-2 rounded-lg hover:bg-accent transition-all duration-300 transform hover:scale-110"
                    aria-label={`${dev.name} Instagram`}
                  >
                    <Instagram size={20} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border mb-6"></div>

        {/* Copyright and Legal Links */}
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
          <div className="text-muted-foreground font-medium">
            © 2025 All rights reserved.
          </div>
          <div className="flex space-x-6">
            <a
              href="/privacy"
              className="text-muted-foreground hover:text-foreground hover:underline underline-offset-4 decoration-2 decoration-primary transition-all duration-300"
            >
              Privacy Policy
            </a>
            <a
              href="/terms"
              className="text-muted-foreground hover:text-foreground hover:underline underline-offset-4 decoration-2 decoration-primary transition-all duration-300"
            >
              Terms & Conditions
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
