import { Component } from "react";

class Fetch extends Component {
  state = {
    loading: true,
    error: false,
    data: []
  };

  componentDidMount() {
    fetch(this.props.url)
      .then(res => {
        if (!res.ok) {
          throw new Error(res.status);
        }
        return res.json();
      })
      .then(data => {
        const { state, result } = data;
        if (state === "OK") {
          this.setState({ loading: false, data: result });
          return;
        }
      })
      .catch(error => this.setState({ loading: false, error }));
  }

  render() {
    return this.props.children(this.state);
  }
}
export default Fetch;
