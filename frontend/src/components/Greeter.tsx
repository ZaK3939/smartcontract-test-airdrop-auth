import React, { FormEvent, useContext, useEffect, useState } from "react";
import { AirdropContext, GreeterContext } from "./../hardhat/SymfoniContext";
import detectEthereumProvider from '@metamask/detect-provider';
import Web3 from 'web3';
import axios from 'axios';
import getBlockchain from "../lib/ethereum";
// import getBlockchain from '../lib/ethereum.ts';

interface Props {}

export const Greeter: React.FC<Props> = () => {
  const greeter = useContext(GreeterContext);
  const air = useContext(AirdropContext);
  const [message, setMessage] = useState("");
  const [inputGreeting, setInputGreeting] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState<any>('Loading...');
  const [claimMessage, setClaimMessage] = useState<any>({
    payload: undefined,
    type: undefined
  });
  const [airdrop, setAirdrop] = useState<any>(undefined);
  const [accounts, setAccounts] = useState<any>(undefined);
  interface chinObj {
 [id: string]: string;
}

const networks:chinObj = {
  '56': 'Binance Smart Chain Mainnet', 
  '97': 'Binance Smart Chain Testnet', 
  '1337': 'Local development blockchain',
  '80001': 'matic/polygon mumbai testnet' 
}


  useEffect(() => {
    const init = async () => {
    
      try { 
        const provider:any = await detectEthereumProvider();
        if(provider) {
          const accounts = await provider.request({ method: 'eth_requestAccounts' });
          const networkId = await provider.request({ method: 'net_version' })
          console.log(networkId)
          console.log(process.env.REACT_APP_NEXT_PUBLIC_NETWORK_ID)
          const targetNetwork =process.env.REACT_APP_NEXT_PUBLIC_NETWORK_ID || '0'
          console.log(targetNetwork)
          if(networkId !== targetNetwork) {
            console.log(`Wrong network, please switch to ${networks[targetNetwork]}`);
          }
       
        // const { airdrop, accounts } = await getBlockchain();
        const airdrop=air
        setAirdrop(airdrop);
        setAccounts(accounts);
        setLoading(false); 
      }
      } catch(e) {
        setLoadingMessage(e);
      }
    };
    init();
  }, []);

  useEffect(() => {
    const doAsync = async () => {
      if (!greeter.instance) return;
      console.log("Greeter is deployed at ", greeter.instance.address);
      setMessage(await greeter.instance.greet());
    };
    doAsync();
  }, [greeter]);

  const handleSetGreeting = async (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    e.preventDefault();
    if (!greeter.instance) throw Error("Greeter instance not ready");
    if (greeter.instance) {
      const tx = await greeter.instance.setGreeting(inputGreeting);
      console.log("setGreeting tx", tx);
      await tx.wait();
      const _message = await greeter.instance.greet();
      console.log("New greeting mined, result: ", _message);
      setMessage(_message);
      setInputGreeting("");
    }
  };
  const claimTokens = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // const address = e.target.elements[0].value.trim().toLowerCase();
    const address =(e.target as HTMLInputElement).value;
    console.log(address)
    setClaimMessage({
      type: 'primary',
      payload: 'Checking your address in whitelist...'
    });
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_NEXT_PUBLIC_BACKEND_URL}/api/authorization`, 
        {
          address
        }
      );
      setClaimMessage({
        type: 'primary',
        payload: `
          Claiming token from Airdrop contract...
          Address: ${response.data.address}
          Total Amount: ${Web3.utils.fromWei(response.data.totalAllocation.toString())} ETB
          -> Basic allocation: ${Web3.utils.fromWei(response.data.basicAllocation.toString())} ETB
          -> Bonus allocation: ${Web3.utils.fromWei(response.data.bonusAllocation.toString())} ETB
        `
      });
      const receipt = await airdrop
        .methods
        .claimTokens(
          response.data.address, 
          response.data.totalAllocation.toString(),
          response.data.signature
        )
        .send({from: accounts[0]});
      setClaimMessage({
        type: 'primary',
        payload: `Airdrop success!
Tokens successfully in tx ${receipt.transactionHash} 
Address: ${response.data.address}
Total Amount: ${Web3.utils.fromWei(response.data.totalAllocation.toString())} ETB
-> Basic allocation: ${Web3.utils.fromWei(response.data.basicAllocation.toString())} ETB
-> Bonus allocation: ${Web3.utils.fromWei(response.data.bonusAllocation.toString())} ETB
        `
      });
    } catch(e) {
      if(axios.isAxiosError(e) && e.message === 'Request failed with status code 401') {
        setClaimMessage({
          type: 'danger',
          payload: `Airdrop failed
Reason: Address not registered`
        });
        return;
      }
      setClaimMessage({
        type: 'danger',
        payload: `Airdrop failed
Reason" Airdrop already sent to ${address}`
      });
    }
  };
  return (
    <div>
      <p>{message}</p>
      <input
        value={inputGreeting}
        onChange={(e) => setInputGreeting(e.target.value)}
      ></input>
      <button onClick={(e) => handleSetGreeting(e)}>Set greeting</button>
      <div className='row mt-4'>
        <div className='col-sm-12'>
          <div className="jumbotron">
            <h1 className='text-center'>Eat The Blocks Airdrop</h1>
          </div>
        </div>
      </div>

      {loading ? (
        <div className='row'>
          <div className='col-sm-12'>
            {loadingMessage}
          </div>
        </div>
      ) : null}

      {loading ? null : (
      <div className='row'>

        <div className='col-sm-6'>
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">How to claim your tokens?</h5>
              <div className="card-text">
                <ul>
                  <li>Step 1: Make sure you have configured the BSC network with Metamask</li>
                  <li>Step 2: Make sure you have some BNB to pay for transaction fees (~1-2 USD worth of BNB, paid to the network</li>
                  <li>Step 3: Enter your BSC address and click on submit. This will fetch an authorization signature from the list of whitelisted address</li>
                  <li>Step 4: Confirm the transaction to claim your ETB tokens. This will send a transaction to the Airdrop smart contract</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className='col-sm-6'>
          <form className="form-inline" onSubmit={e => claimTokens(e)}>
            <input 
              type="text" 
              className="form-control mb-2 mr-sm-2 col-sm-12" 
              placeholder="BSC Address"
            />
            <button 
              type="submit" 
              className="btn btn-primary mb-2 col-sm-12"
            >
              Submit
            </button>
          </form>
          <div>
            {typeof claimMessage.payload !== 'undefined' ?  (
              <div className={`alert alert-${claimMessage.type}`} role="alert">
                <span style={{ whiteSpace: 'pre' }}>
                  {claimMessage.payload}
                </span>
              </div>
            ) : ''}
          </div>
        </div>
      </div>
      )}
    </div>
    
  );
};
