import React, { Component } from "react";
import axios from 'axios';
import PropTypes from "prop-types";
import "./Onboarding.css";

/**
 * define Onboarding, a component that will handle
 * the wallet selection and account address selection logic
 */
export default class Onboarding extends Component {
  static propTypes = {
    wallets: PropTypes.array.isRequired,
    onDone: PropTypes.func.isRequired
  };
  state = {
    pending: false,
    web3: null,
    error: null,
    accounts: null,
    selectedWalletIndex: -1,
    selectedAccountIndex: 0,
    tokenBalance: 0
  };
  //ref test. plz remove
  token = React.createRef();
  //

  onWalletChange = async e => {
    const selectedWalletIndex = parseInt(e.target.value, 10);
    const wallet = this.props.wallets[selectedWalletIndex];
    try {
      this.setState({
        selectedWalletIndex,
        pending: true,
        accounts: null,
        error: null
      });
      const web3 = await wallet.getWeb3();

      //Wallet test part
      /*
      web3.eth.getAccounts().then((result) => {
        console.log(result);
        axios.get('https://192.168.0.63:3001/balance/' + result.toString().substring(2,))
        .then((balance) => console.log(balance.data.data.APIS));
      });
      */
      //Wallet

      const accounts = await new Promise((resolve, reject) => {
        web3.eth.getAccounts((error, accounts) => {
          if (error) reject(error);
          else resolve(accounts);
        });
      });
      if (accounts.length === 0) throw new Error("no accounts found");
      this.setState({
        web3,
        accounts,
        pending: false,
        error: null
      });
    } catch (error) {
      this.setState({ error, pending: false });
    }
  };

  onAccountChange = e => {
    this.setState({ selectedAccountIndex: parseInt(e.target.value, 10) });
  };

  /*
  * Token checking function
  * triggered by button
  */

  onCheck = () => {                    // Check Token butten onclick event
    console.log(this.state);           // for debug
    console.log(this.state.accounts);  // for debug
    if (this.state.accounts !== null) {
      // http server get request(send account address which is selected, cut out first two letter '0x' - which can't be used on APIS network)
      axios.get('https://192.168.0.63:3001/balance/' + this.state.accounts[this.state.selectedAccountIndex].toString().substring(2, ))
        .then((balance) => {
          // NOTE : callback hell
          // get blocknumber via http server get request.
          axios.get('https://192.168.0.63:3001/blocknumber')
            .then((blockNum) => {
              /*
              * Result Data structure : Object.data.data.(attr) - final data
              * ex) balance.data.data.APIS / blockNum.data.data.blocknumber
              */ 
              console.log(balance.data.data.APIS);
              this.state.tokenBalance = (balance.data.data.APIS);
              // mofify document
              document.getElementById('balance').innerHTML = "Token Balance : " + this.state.tokenBalance + "(Block " + blockNum.data.data.blocknumber + ")";
            });
        });
    }
  }

  onDone = () => {
    const { web3, accounts, selectedAccountIndex } = this.state;
    const account = accounts && accounts[selectedAccountIndex];
  };

  render() {
    const { wallets } = this.props;
    const {
      pending,
      error,
      accounts,
      selectedAccountIndex,
      selectedWalletIndex
    } = this.state;
    //test part
    return (
      <div className="Onboarding">
        <section>
          <h1 id='balance'></h1>
          <h2>1. select a wallet</h2>
          <div className="wallets">
            {wallets.map((wallet, i) => (
              <label key={i}>
                <input
                  type="radio"
                  name="onboarding-wallet"
                  value={i}
                  disabled={pending}
                  checked={selectedWalletIndex === i}
                  onChange={this.onWalletChange}
                />
                {wallet.name}
              </label>
            ))}
          </div>
        </section>
        {accounts ? (
          <section>
            <h2>2. select an account</h2>
            <div className="accounts">
              {accounts.map((account, i) => (
                <label key={account}>
                  <input
                    type="radio"
                    name="onboarding-account"
                    value={i}
                    disabled={pending}
                    checked={selectedAccountIndex === i}
                    onChange={this.onAccountChange}
                  />
                  {account}
                </label>
              ))}
            </div>
            <footer>
              <button onClick={this.onDone}>Connect</button> <br />
              <button onClick={this.onCheck}>Check Token</button>
            </footer>
          </section>
        ) : null}
        {pending ? <div className="loading">Loading...</div> : null}
        {error ? (
          <div className="error">
            {String((error && error.message) || error)}
          </div>
        ) : null}
      </div>
    );
  }
}
