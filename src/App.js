import React, { useEffect, useState } from "react";
import "./App.css";

import { ConnectButton, Modal } from "web3uikit";
import logo from "./images/Moralis.png";
import Coin from './components/Coin';
import { abouts } from "./about";
import { useMoralisWeb3Api, useMoralis } from "react-moralis";

const App = () => {

  const [btc, setBtc] = useState(50);
  const [eth, setEth] = useState(33);
  const [link, setLink] = useState(69);
  const [modalPrice, setModalPrice] = useState();
  const [visible, setVisible] = useState(false);
  const [modalToken, setModalToken] = useState();

  const Web3Api = useMoralisWeb3Api();
  const { Moralis, isInitialized } = useMoralis();

  async function getRatio(ticker, setPerc) {
    const Votes = Moralis.Object.extend("Votes"); // extend object from moralis db
    const query = new Moralis.Query(Votes);
    query.equalTo("ticker", ticker);
    query.descending("createdAt"); // get first element
    const results = await query.first();
    let up = Number(results.attributes.up);
    let down = Number(results.attributes.down);
    let ratio = Math.round(up/(up+down)*100);
    setPerc(ratio);
  }

  useEffect(() => {
    if (isInitialized) {
      getRatio("BTC", setBtc);
      getRatio("ETH", setEth);
      getRatio("LINK", setLink);

      async function createLiveQuery() {
        let query = new Moralis.Query('Votes');
        let subscription = await query.subscribe();
        subscription.on('update', (object) => {
  
          if (object.attributes.ticker === "LINK") {
            getRatio("LINK", setLink);
          } else if(object.attributes.ticker === "ETH") {
            getRatio("ETH", setEth);
          } else if(object.attributes.ticker === "BTC") {
            getRatio("BTC", setBtc);
          }
        });
      }

      createLiveQuery();
    }
  }, [isInitialized]); // everytime this state changes (when app runs for first time)

  // fetches token price every time a modal is opened
  useEffect(() => {
    async function fetchTokenPrice() {
      const options = {
        address:
          abouts[abouts.findIndex((x) => x.token === modalToken)].address,
      };
      const price = await Web3Api.token.getTokenPrice(options);
      setModalPrice(price.usdPrice.toFixed(2));
    }
    // just to verify the modal token does exist
    if (modalToken) {
      fetchTokenPrice();
    }
    
  }, [modalToken]);

  return (
    <>
     <div className="header">
      <div className="logo">
        <img src={logo} alt="logo" height="50px" />
        Sentiment
      </div>
      <ConnectButton />
     </div>
     <div className="instructions">
      Where do you think these tokens are going? Up or Down?
     </div>
    <div className="list">
      <Coin 
        perc={btc}
        setPerc={setBtc}
        token={"BTC"}
        setModalToken={setModalToken}
        setVisible={setVisible}
      />
      <Coin 
        perc={eth}
        setPerc={setEth}
        token={"ETH"}
        setModalToken={setModalToken}
        setVisible={setVisible}
      />
      <Coin 
        perc={link}
        setPerc={setLink}
        token={"LINK"}
        setModalToken={setModalToken}
        setVisible={setVisible}
      />
     </div>

     <Modal 
        isVisible={visible}
        onCloseButtonPressed={() => setVisible(false)}
        hasFooter={false}
        title={modalToken}
      >
        <div>
          <span style={{ color: "white" }}>{`Price: `}</span>
          {modalPrice}$
        </div>
        <div>
          <span style={{ color: "white" }}>About</span>
        </div>
        <div>
          {modalToken &&
            abouts[abouts.findIndex((x) => x.token === modalToken)].about}
        </div>
     </Modal>
    </>
  );
};

export default App;
