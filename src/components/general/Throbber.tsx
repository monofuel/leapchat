import * as React from 'react';
import * as ReactDOM from 'react-dom';

class Throbber extends React.Component<null, null> {
  public componentDidMount(){
    this.animateLoadingDots();
  }

  // this is messy, just a test animating react elements
  // by their ref directly.
  private animateLoadingDots(){
    const keyframes = [
      { transform: 'scale(0.7)' },
      { transform: 'scale(1.0)' },
      { transform: 'scale(0.7)' },
    ];

    const properties = {
      duration: 1000,
      iterations: Infinity,
      delay: 0,
    };

    const firstDot = ReactDOM.findDOMNode(this.refs.firstDot) as any;
    firstDot.animate(keyframes, properties);

    properties.delay = 200;

    const secondDot = ReactDOM.findDOMNode(this.refs.secondDot) as any;
    secondDot.animate(keyframes, properties);

    properties.delay = 400;

    const thirdDot = ReactDOM.findDOMNode(this.refs.thirdDot) as any;
    thirdDot.animate(keyframes, properties);
  }

  public render(){
    return (
      <div className="row">
        <div className="col-md-12 throbber" title="Your content is loading...">
          <div className="dot" ref="firstDot"></div>
          <div className="dot" ref="secondDot"></div>
          <div className="dot" ref="thirdDot"></div>
        </div>
      </div>
    )
  }
}

export default Throbber;
