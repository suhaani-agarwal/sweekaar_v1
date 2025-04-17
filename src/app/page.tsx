"use client"
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentTherapist, setCurrentTherapist] = useState(0);

  // Therapist data
  const therapists = [
    {
      name: "Dr. Anjali Mehta",
      specialty: "Behavioral Therapist",
      experience: "12 years experience with autism spectrum disorders",
      image: "/therapist1.png"
    },
    {
      name: "Dr. Rahul Singh",
      specialty: "Speech Therapist",
      experience: "10 years specializing in communication development",
      image: "/public/therapist2.png"
    },
    {
      name: "Dr. Priya Joshi",
      specialty: "Occupational Therapist",
      experience: "8 years working with sensory processing disorders",
      image: "/therapist3.png"
    },
    {
      name: "Dr. Vikram Patel",
      specialty: "Physical Therapist",
      experience: "15 years expertise in motor skill development",
      image: "/therapist4.jpg"
    }
  ];

  // Carousel auto-rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTherapist((prev) => (prev + 1) % therapists.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [therapists.length]);

  const goToTherapist = (index: number) => {
    setCurrentTherapist(index);
  };

  // Taupe color palette
  const colors = {
    primary: '#D6BC8B',         // Warm golden taupe - more vibrant than original
    primaryDark: '#B8976C',     // Darker golden taupe
    primaryLight: '#E8D4AF',    // Light warm beige
    secondary: '#94785A',       // Medium warm taupe
    accent: '#FFCF8B',          // Soft peachy/apricot accent - children are attracted to this warmth
    highlight: '#FFB347',       // Mango/orange highlight for important elements - kids love this pop of color
    text: '#5D4B36',            // Dark taupe for text - good contrast but softer than black
    textLight: '#7A6A5F',       // Lighter text color
    background: '#FBF7F1',      // Very light cream background - easier on children's eyes
    white: '#FFFFFF',
    offWhite: '#FAF9F7',
    softBlue: '#B7D1E2',        // Soft blue for variety - children respond to blue as calming
    softGreen: '#C5D8B9'        // Soft green for variety - children like natural colors
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: colors.background }}>
      <Head>
        <title>Sweekaar | Support for Neurodivergent Children</title>
        <meta name="description" content="Supporting children with autism and cerebral palsy to thrive and reach their full potential." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Navigation */}
      <header style={{ backgroundColor: colors.primary }}>
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full" style={{ backgroundColor: colors.secondary }}>
              <div className="text-white font-bold text-lg flex items-center justify-center h-full">S</div>
            </div>
            <h1 className="text-2xl font-bold text-white">Sweekaar</h1>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex gap-6">
            <Link href="/" className="font-medium text-white hover:opacity-80 transition">Home</Link>
            <Link href="/about" className="font-medium text-white hover:opacity-80 transition">About Us</Link>


            <Link href="/contact" className="font-medium text-white hover:opacity-80 transition">Contact</Link>
          </nav>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden" style={{ backgroundColor: colors.primaryDark }}>
            <nav className="flex flex-col gap-2 px-4 py-2">
              <Link href="/" className="py-2 px-3 text-white hover:bg-opacity-20 hover:bg-white rounded transition">Home</Link>
              <Link href="/about" className="py-2 px-3 text-white hover:bg-opacity-20 hover:bg-white rounded transition">About Us</Link>
              <Link href="/services" className="py-2 px-3 text-white hover:bg-opacity-20 hover:bg-white rounded transition">Services</Link>
              <Link href="/resources" className="py-2 px-3 text-white hover:bg-opacity-20 hover:bg-white rounded transition">Resources</Link>
              <Link href="/contact" className="py-2 px-3 text-white hover:bg-opacity-20 hover:bg-white rounded transition">Contact</Link>
            </nav>
          </div>
        )}
      </header>

      <main className="flex-grow">
        {/* Hero Section */}
        <section style={{ backgroundColor: colors.primary }}>
          <div className="container mx-auto px-4 md:px-8 flex flex-col md:flex-row items-center gap-8 py-16">
            <div className="md:w-1/2 space-y-6">
              <h2 className="text-4xl md:text-5xl font-bold leading-tight text-white">
                Supporting Every Child's Unique Journey
              </h2>
              <p className="text-lg md:text-xl text-white opacity-90">
                Sweekaar provides specialized support and resources for neurodivergent children,
                helping them thrive and reach their full potential.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/services"
                  className="bg-white px-6 py-3 rounded-lg font-bold hover:bg-opacity-90 transition"
                  style={{ color: colors.text }}
                >
                  Get Started
                </Link>
                <Link
                  href="/login"
                  className="bg-transparent border-2 border-white text-white px-6 py-3 rounded-lg font-bold"
                >
                  Login
                </Link>
              </div>
            </div>
            <div className="md:w-1/2 flex justify-center">
              <div className="relative w-full h-64 md:h-96 rounded-lg overflow-hidden">
                <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: colors.primaryLight }}>
                  <p style={{ color: colors.text }}>Image of children playing and learning together</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Therapist Carousel Section */}
        <section className="py-16" style={{ backgroundColor: colors.offWhite }}>
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4" style={{ color: colors.text }}>Our Specialized Therapists</h2>
              <p className="text-lg max-w-2xl mx-auto" style={{ color: colors.textLight }}>
                Meet our team of dedicated professionals who bring expertise and compassion to support your child's development.
              </p>
            </div>

            {/* Carousel */}
            <div className="relative max-w-4xl mx-auto">
              <div className="relative h-96 overflow-hidden rounded-lg shadow-lg">
                {therapists.map((therapist, index) => (
                  <div
                    key={index}
                    className={`absolute top-0 left-0 w-full h-full transition-opacity duration-500 ease-in-out ${index === currentTherapist ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                  >
                    <div className="flex flex-col md:flex-row h-full">
                      <div className="md:w-1/2 flex justify-center items-center p-4" style={{ backgroundColor: colors.primaryLight }}>
                        <div
                          className="w-48 h-48 md:w-64 md:h-64 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: colors.primary }}
                        >
                          <p style={{ color: colors.white }}>
                            Photo of {therapist.name}
                          </p>
                        </div>
                      </div>
                      <div className="md:w-1/2 p-8 flex flex-col justify-center" style={{ backgroundColor: colors.white }}>
                        <h3 className="text-2xl font-bold mb-2" style={{ color: colors.text }}>{therapist.name}</h3>
                        <p className="font-semibold mb-4" style={{ color: colors.accent }}>{therapist.specialty}</p>
                        <p style={{ color: colors.textLight }}>{therapist.experience}</p>
                        <Link
                          href="/team"
                          className="mt-6 font-semibold flex items-center hover:opacity-80 transition"
                          style={{ color: colors.secondary }}
                        >
                          Learn more
                          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Navigation Buttons */}
              <button
                onClick={() => setCurrentTherapist((currentTherapist - 1 + therapists.length) % therapists.length)}
                className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-4 md:-translate-x-6 rounded-full p-2 shadow-md z-20 hover:opacity-80 transition"
                style={{ backgroundColor: colors.white }}
              >
                <svg className="w-6 h-6" fill="none" stroke={colors.text} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => setCurrentTherapist((currentTherapist + 1) % therapists.length)}
                className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-4 md:translate-x-6 rounded-full p-2 shadow-md z-20 hover:opacity-80 transition"
                style={{ backgroundColor: colors.white }}
              >
                <svg className="w-6 h-6" fill="none" stroke={colors.text} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Indicator Dots */}
              <div className="flex justify-center mt-6 gap-2">
                {therapists.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToTherapist(index)}
                    className={`w-3 h-3 rounded-full transition ${currentTherapist === index ? 'opacity-100' : 'opacity-50'}`}
                    style={{ backgroundColor: currentTherapist === index ? colors.secondary : colors.primary }}
                    aria-label={`Go to therapist ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Services Overview */}
        <section className="py-16" style={{ backgroundColor: colors.white }}>
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4" style={{ color: colors.text }}>How We Support</h2>
              <p className="text-lg max-w-2xl mx-auto" style={{ color: colors.textLight }}>
                We offer a range of specialized services designed to meet the unique needs of neurodivergent children.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Service Card 1 */}
              <div
                className="p-6 rounded-lg shadow-md hover:shadow-lg transition"
                style={{ backgroundColor: colors.offWhite }}
              >
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                  style={{ backgroundColor: colors.primary }}
                >
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2" style={{ color: colors.text }}>Specialized Education</h3>
                <p style={{ color: colors.textLight }}>
                  Customized learning approaches that adapt to each child's unique needs and learning style.
                </p>
              </div>

              {/* Service Card 2 */}
              <div
                className="p-6 rounded-lg shadow-md hover:shadow-lg transition"
                style={{ backgroundColor: colors.offWhite }}
              >
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                  style={{ backgroundColor: colors.primary }}
                >
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2" style={{ color: colors.text }}>Therapy Services</h3>
                <p style={{ color: colors.textLight }}>
                  Comprehensive therapy programs including speech, occupational, physical, and behavioral therapy.
                </p>
              </div>

              {/* Service Card 3 */}
              <div
                className="p-6 rounded-lg shadow-md hover:shadow-lg transition"
                style={{ backgroundColor: colors.offWhite }}
              >
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                  style={{ backgroundColor: colors.primary }}
                >
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2" style={{ color: colors.text }}>Family Support</h3>
                <p style={{ color: colors.textLight }}>
                  Guidance, resources, and community for families navigating the journey with their neurodivergent child.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-16" style={{ backgroundColor: colors.offWhite }}>
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4" style={{ color: colors.text }}>Stories from Our Community</h2>
              <p className="text-lg max-w-2xl mx-auto" style={{ color: colors.textLight }}>
                Hear from families whose lives have been transformed through our support and services.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Testimonial 1 */}
              <div
                className="p-6 rounded-lg shadow-md"
                style={{ backgroundColor: colors.white, borderColor: colors.primaryLight, borderWidth: '1px' }}
              >
                <p className="italic mb-4" style={{ color: colors.text }}>
                  "Sweekaar has been a lifeline for our family. The therapists understand our son's needs so well, and
                  he's made incredible progress in his communication skills. We finally feel supported on this journey."
                </p>
                <div className="flex items-center">
                  <div
                    className="w-12 h-12 rounded-full mr-4"
                    style={{ backgroundColor: colors.primary }}
                  ></div>
                  <div>
                    <h4 className="font-bold" style={{ color: colors.text }}>Priya Sharma</h4>
                    <p className="text-sm" style={{ color: colors.textLight }}>Parent of a child with autism</p>
                  </div>
                </div>
              </div>

              {/* Testimonial 2 */}
              <div
                className="p-6 rounded-lg shadow-md"
                style={{ backgroundColor: colors.white, borderColor: colors.primaryLight, borderWidth: '1px' }}
              >
                <p className="italic mb-4" style={{ color: colors.text }}>
                  "The physical therapy program at Sweekaar has helped my daughter gain mobility and confidence.
                  The staff's patience and expertise have made all the difference in her development."
                </p>
                <div className="flex items-center">
                  <div
                    className="w-12 h-12 rounded-full mr-4"
                    style={{ backgroundColor: colors.primary }}
                  ></div>
                  <div>
                    <h4 className="font-bold" style={{ color: colors.text }}>Rajiv Patel</h4>
                    <p className="text-sm" style={{ color: colors.textLight }}>Parent of a child with cerebral palsy</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16" style={{ backgroundColor: colors.primary }}>
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4 text-white">Start Your Journey with Sweekaar Today</h2>
            <p className="text-xl max-w-2xl mx-auto mb-8 text-white opacity-90">
              Take the first step towards providing the specialized support your child deserves.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/services"
                className="bg-white px-8 py-4 rounded-lg font-bold hover:bg-opacity-90 transition"
                style={{ color: colors.text }}
              >
                Get Started
              </Link>
              <Link
                href="/resources"
                className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg font-bold hover:bg-white hover:bg-opacity-20 transition"
              >
                Explore Resources
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer style={{ backgroundColor: colors.secondary }}>
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-full" style={{ backgroundColor: colors.primary }}>
                  <div className="text-white font-bold text-lg flex items-center justify-center h-full">S</div>
                </div>
                <h3 className="text-xl font-bold text-white">Sweekaar</h3>
              </div>
              <p className="mb-4 text-white opacity-80">
                Supporting neurodivergent children and their families with compassion, expertise, and understanding.
              </p>
              <div className="flex gap-4">
                <a href="#" className="text-white opacity-80 hover:opacity-100 transition">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                  </svg>
                </a>
                <a href="#" className="text-white opacity-80 hover:opacity-100 transition">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                  </svg>
                </a>
                <a href="#" className="text-white opacity-80 hover:opacity-100 transition">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
              </div>
            </div>

            <div>
              <h4 className="text-white font-bold text-lg mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><Link href="/about" className="text-white opacity-80 hover:opacity-100 transition">About Us</Link></li>
                <li><Link href="/services" className="text-white opacity-80 hover:opacity-100 transition">Our Services</Link></li>
                <li><Link href="/team" className="text-white opacity-80 hover:opacity-100 transition">Our Team</Link></li>
                <li><Link href="/testimonials" className="text-white opacity-80 hover:opacity-100 transition">Success Stories</Link></li>
                <li><Link href="/faq" className="text-white opacity-80 hover:opacity-100 transition">FAQs</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold text-lg mb-4">Services</h4>
              <ul className="space-y-2">
                <li><Link href="/services/assessment" className="text-white opacity-80 hover:opacity-100 transition">Assessment</Link></li>
                <li><Link href="/services/therapy" className="text-white opacity-80 hover:opacity-100 transition">Therapy Services</Link></li>
                <li><Link href="/services/education" className="text-white opacity-80 hover:opacity-100 transition">Special Education</Link></li>
                <li><Link href="/services/family" className="text-white opacity-80 hover:opacity-100 transition">Family Support</Link></li>
                <li><Link href="/services/workshops" className="text-white opacity-80 hover:opacity-100 transition">Workshops</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold text-lg mb-4">Contact Us</h4>
              <address className="not-italic space-y-2 text-white opacity-80">
                <p>123 Healing Lane</p>
                <p>Mumbai, Maharashtra 400001</p>
                <p>Phone: <a href="tel:+919876543210" className="hover:opacity-100 transition">+91 98765 43210</a></p>
                <p>Email: <a href="mailto:info@sweekaar.org" className="hover:opacity-100 transition">info@sweekaar.org</a></p>
              </address>
            </div>
          </div>

          <div className="mt-12 pt-8 text-center" style={{ borderTopColor: colors.primary, borderTopWidth: '1px' }}>
            <p className="text-white opacity-80">&copy; {new Date().getFullYear()} Sweekaar. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}