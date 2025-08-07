import React from "react";

const Footer = () => (
  <footer className="bg-light text-center text-muted py-3 mt-auto border-top">
    <div>
      &copy; {new Date().getFullYear()} <strong className="text-primary">ProjectManager</strong>&nbsp;|&nbsp;
      <span style={{fontSize:'.98em'}}>Built with <span style={{color:'#0052CC'}}>Bootstrap 5</span></span>
    </div>
  </footer>
);

export default Footer;
