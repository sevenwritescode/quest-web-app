import { Component } from 'react';
import Landing from './Landing';

type Player = { id: string, name: string }

type AppState =
| { page: "landing", payload: LandingState } 
| { page: "lobby", payload: LobbyState } 
| { page: "game", payload: GameState}

export type LandingState = { code: string }
export type LobbyState = { players: Player[], clientId: string }
export type GameState = {}

class App extends Component<{}, AppState> {
  state: AppState = {
    page: "landing", 
    payload: { code: "" }
  }

  render = () => {
    if (this.state.page === "landing") {
      return <Landing payload={this.state.payload} onPayloadChange={this.updateLanding}></Landing>
    }
    if (this.state.page === "lobby")
    {
      // return <Lobby></Lobby>
    }
  }

  updateLanding = (patch: Partial<LandingState>) => {
    if (this.state.page !== "landing") {
      throw new Error("App is in an invalid state: attempt to update code while not on landing page");
    }
    this.setState({
      page: "landing",
      payload: { ...this.state.payload, ...patch }
    });
  }
}

export default App;