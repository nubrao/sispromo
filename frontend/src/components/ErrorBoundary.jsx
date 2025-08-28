import React from 'react';
import { Result, Button } from 'antd';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Error:', error);
        console.error('Error Info:', errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <Result
                    status="error"
                    title={this.props.errorTitle || "Something went wrong"}
                    subTitle={this.props.errorDescription || "Please try again"}
                    extra={[
                        <Button
                            key="reload"
                            type="primary"
                            onClick={() => window.location.reload()}
                        >
                            {this.props.reloadButtonText || "Reload"}
                        </Button>,
                        <Button
                            key="back"
                            onClick={() => {
                                this.setState({ hasError: false });
                                window.history.back();
                            }}
                        >
                            {this.props.backButtonText || "Back"}
                        </Button>
                    ]}
                />
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;