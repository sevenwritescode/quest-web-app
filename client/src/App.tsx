import React, { Component } from 'react';

// Define props interface
interface AppProps {
  // Add your props here
}

// Define state interface
interface AppState {
  // Add your state properties here
}

class App extends Component<AppProps, AppState> {
  constructor(props: AppProps) {
    super(props);
    this.state = {
      // Initialize your state here
    };
  }

  render() {
    return (
    <>
      <div className="flex justify-center text-center align-middle font-[Chomsky] text-4xl  p-10">
        <h1 className=""> The <span className="text-red-700">Quest</span> Web App Companion </h1>
      </div>

      <div className="flex justify-center flex-col space-x-6 items-center font-[Consolas]">
        <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 m-1">
          Host
        </button>
        <div className="flex items-center space-x-2 m-2">
          
          <button className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 m-1" 
            onClick={() => console.log("click!")}>  
            <input
              type="text"
              size={4}
              onClick={(e) => e.stopPropagation()}
              className="rounded bg-green-800 px-2 py-1 w-[6ch] mr-2 text-center placeholder-gray-400"
              placeholder="----"
            />
            Join
          </button>
        </div>
      </div>
    
    </>
    );
  }
}

export default App;