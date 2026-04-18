import React from "react";
import nav from "../assets/nav.jpeg";
import jcc from "../assets/jcc.svg";

const Navbar = () => {
  return (
    <nav className="relative w-full overflow-hidden">
      {/* 1. h-16 for mobile, h-24 for tablets/desktop. 
          2. object-cover ensures the image fills the space without stretching.
      */}
      <img 
        src={nav} 
        alt="navigation background" 
        className="w-full h-12 md:h-20 lg:h-16 object-fill" 
      />
     
      <div className="absolute top-1/2 right-4 md:right-10 lg:right-20 -translate-y-1/2">
        <img
          src={jcc}
          alt="logo"
          className="w-12 sm:w-16 md:w-20 lg:w-24 h-auto object-contain"
        />
      </div>
    </nav>
  );
};

export default Navbar;