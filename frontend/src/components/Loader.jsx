import Lottie from "lottie-react";
import loader from "../assets/animations/loader.json";

const Loader = () => {
    return (
        <>
            <Lottie
                animationData={loader}
                loop={true}
                background="transparent"
                speed="1"
                style={{ width: "100%", height: "100%" }}
                autoplay
            ></Lottie>
        </>
    );
};

export default Loader;
