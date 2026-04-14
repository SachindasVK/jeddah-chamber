import "./Loading.css";
import jcc from "../../../assets/jcc.svg";

const Loading = () => {
  return (
    <div className="splash-overlay">
      <div className="loader-wrap">
        <div className="pulse-circle pulse1"></div>
        <div className="pulse-circle pulse2"></div>
        <div className="pulse-circle pulse3"></div>
        <div className="logo-wrap">
          <img src={jcc} alt="" />
        </div>
      </div>
    </div>
  );
};

export default Loading;
