import React from "react";
import nav from "../assets/nav.jpeg";
import jcc from "../assets/jcc.svg";

const Navbar = () => {
  return (
    <div className="relative w-full">
      {/* The background background image */}
      <img src={nav} alt="nav" className="w-full h-20 object-cover" />
      
      {/* The logo moved to the right */}
      <img
        src={jcc}
        alt="logo"
        className="absolute top-4 right-15 w-16 md:w-20" 
        /* Changed left-4 to right-4 */
      />
    </div>
  );
};

export default Navbar;