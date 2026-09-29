import type { Metadata } from "next";
import { ABeeZee, Sora, Manrope } from "next/font/google";
import "./globals.css";
import SiteLayout from "@/components/layout/SiteLayout";
import RouteTracker from "@/components/RouteTracker";

const abeezee = ABeeZee({
  subsets: ["latin"],
  variable: "--font-abeezee",
  display: "swap",
  weight: ["400"],
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Brandbanalo",
    template: "%s | Brandbanalo",
  },
  description:
    "Brandbanalo is a creative and digital marketing agency helping businesses grow with branding, web development, SEO, social media, lead generation, and performance ads.",
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: "gPvUUHVjBVLzT0DBX9jGAq_C-6MHpb-amXIw7dS3er4",
  },
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth" className={`${abeezee.variable} ${sora.variable} ${manrope.variable}`}>
      <head>
        <link rel="stylesheet" href="/assets/css/bootstrap.min.css" />
        <link rel="stylesheet" href="/assets/css/all.min.css" />
        <link rel="stylesheet" href="/assets/css/animate.css" />
        <link rel="stylesheet" href="/assets/css/icomoon.css" />
        <link rel="stylesheet" href="/assets/css/magnific-popup.css" />
        <link rel="stylesheet" href="/assets/css/meanmenu.css" />
        <link rel="stylesheet" href="/assets/css/swiper-bundle.min.css" />
        <link rel="stylesheet" href="/assets/css/nice-select.css" />
        <link rel="stylesheet" href="/assets/css/tabler-icons.min.css" />
        <link rel="stylesheet" href="/assets/css/color.css" />
        <link rel="stylesheet" href="/assets/css/main.css" />
        <link rel="shortcut icon" href="/assets/img/favicon.svg" />
      </head>
      <body suppressHydrationWarning>
        <RouteTracker />
        <SiteLayout>{children}</SiteLayout>
      </body>
    </html>
  );
}

