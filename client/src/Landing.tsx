import { Component } from "react";

interface LandingProps {
  code: string,
  onCodeChange: (code: string) => void
}

class Landing extends Component<LandingProps> {
  constructor(props: LandingProps) {
    super(props);
  }

  render() {
    return (
      <>
        <div className="flex justify-center text-center align-middle text-shadow-[0px_4px_8px_rgba(0,0,0,0.75)] font-serif text-5xl  p-10">
          <h1 className=""> The <span className="font-[Chomsky] text-6xl text-[rgb(213,4,4)]">Quest</span> Web App Companion </h1>
        </div>

        <div className="flex justify-center space-x-6 items-center font-[Consolas]">
          <button className="h-12 w-28 bg-[rgb(230,97,2)] text-white rounded hover:bg-[rgb(184,77,0)] m-1 flex items-center justify-center font-mono text-shadow-lg text-2xl">
            Host
          </button>
          <div className="flex items-center space-x-2 m-2">

            <button className="h-12 p-2 bg-green-600 text-white rounded hover:bg-green-700 m-1 flex items-center justify-center font-mono text-shadow-lg text-2xl"
              onClick={() => console.log("click!")}>
              <input
                type="text"
                size={4}
                onClick={(e) => e.stopPropagation()}
                value={this.props.code}
                onChange={this.validateCodeInput}
                className="rounded bg-green-800 h-8 px-2 mr-2 text-left placeholder-gray-400"
                placeholder="----"
              />
              Join
            </button>
          </div>
        </div>
      </>
    );
  }

  validateCodeInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    let input = event.target.value;
    // drop all non alpha characters
    input = input.replace(/[^A-Za-z]/g, '');
    console.log(input);
    if (input.length > 4) {
      // input is too long, drop the end
      input = input.slice(0, 4);
    }
    this.props.onCodeChange(input.toUpperCase());
  }
}


export default Landing;