import React from "react";
import nav from "../../assets/nav.jpeg";
import jcc from "../../assets/jcc.svg";

const Navbar = () => {
  return (
    <div className="relative w-full">
      {/* Background Image */}
      <img src={nav} alt="nav" className="w-full h-20 object-cover" />

      {/* Logo (Top Left) */}
      <img
        src={jcc}
        alt="logo"
        className="absolute top-4 left-4 w-20 md:w-24"
      />
    </div>
  );
};

export default Navbar;