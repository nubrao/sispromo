const Hamburger = (props) => {
    return (
        <svg
            width={48}
            height={48}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            {...props}
        >
            <path
                d="M5.70001 14.4999C5.70001 13.9476 6.14773 13.4999 6.70001 13.4999H9.50001C10.0523 13.4999 10.5 13.9476 10.5 14.4999V17.2999C10.5 17.8522 10.0523 18.2999 9.50001 18.2999H6.70001C6.14773 18.2999 5.70001 17.8522 5.70001 17.2999V14.4999Z"
                fill="#89B789"
            />
            <rect
                x={5.70001}
                y={5.69995}
                width={4.8}
                height={4.8}
                rx={1}
                fill="#89B789"
            />
            <rect
                x={13.5}
                y={13.5}
                width={4.8}
                height={4.8}
                rx={1}
                fill="#89B789"
            />
            <rect
                x={13.5}
                y={5.69995}
                width={4.8}
                height={4.8}
                rx={1}
                fill="#89B789"
            />
        </svg>
    );
};

export default Hamburger;
