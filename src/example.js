import React from "react";

export default class Eaxmple extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            text: "변경 전이요",
            value: 0,
        };
    }
    render() {
        return (
            <div>
                <h1>{this.state.text}</h1>
                <button onClick={this.changeText}>벗은</button>
            </div>
        );
    }

    changeText = () => {
        if(this.state.value === 0)
        {
            this.setState({
                text: "변경 선공!",
                value: 1,
            });
        }
        else{
            this.setState({
                text: "변경 후공!",
                value: 0,
            });
        }
    };
}