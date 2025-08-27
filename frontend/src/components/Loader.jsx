import Lottie from "lottie-react";
import PropTypes from "prop-types";
import loader from "../assets/animations/loader.json";
import "../styles/loader.css";

const Loader = ({
    containerClassName = "",
    size = "medium",
    text = "Carregando...",
}) => {
    const sizeMap = {
        small: { width: 50, height: 50 },
        medium: { width: 100, height: 100 },
        large: { width: 150, height: 150 },
        fullscreen: { width: "100%", height: "100%" },
    };

    const dimensions = sizeMap[size] || sizeMap.medium;

    return (
        <div className={`loader-container ${containerClassName}`}>
            <div className="loader-content">
                <Lottie
                    animationData={loader}
                    loop={true}
                    background="transparent"
                    speed={1}
                    style={dimensions}
                    autoplay
                />
                {text && <p className="loader-text">{text}</p>}
            </div>
        </div>
    );
};

Loader.propTypes = {
    containerClassName: PropTypes.string,
    size: PropTypes.oneOf(["small", "medium", "large", "fullscreen"]),
    text: PropTypes.string,
};

export default Loader;
