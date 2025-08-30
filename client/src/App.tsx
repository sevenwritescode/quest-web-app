import { Component } from 'react';
import Landing from './Landing';

interface AppProps {
}

interface AppState {
  page: Page
}

type Page = { kind: "landing", code: string } | { kind: "lobby" } | { kind: "game" }

class App extends Component<AppProps, AppState> {
  constructor(props: AppProps) {
    super(props);
    this.state = {
      page: { kind: "landing", code: "" }
    };
  }

  render = () => {
    if (this.state.page.kind === "landing") {
      return <Landing code={this.state.page.code} onCodeChange={this.doUpdateCode}></Landing>
    }
  }

  doUpdateCode = (code: string) => {
    if (this.state.page.kind !== "landing") {
      throw new Error("App is in an invalid state: attempt to update code while not on landing page");
    }
    this.setState({
      page: { kind: "landing", code }
    });
  }
}

export default App;