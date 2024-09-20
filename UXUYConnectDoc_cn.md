

###  Mooniswap 支持UxuyConnect 的思路和方法与步骤


### 整体思路
  根据mooniswap的整体架构分析，我们只需要添加一个UxuyTgConnector,实现Web3-react的抽象方法 ，进而让mooniswap增加支持Telegram小程序钱包  UXUY 。让mooniswap在telegram的体验更加丝滑



##### 1 Moonswap代码结构目录分析
``` 
src
    |- assets
        |- images           // 存放 logo 图标的地方，添加 uxuywallet.svg
    
    |- connectors           // 基于 ReactWeb3 的钱包连接器目录
        |- index.ts

    |- constants            // Swap 应用常量配置目录
        |- index.ts         // 支持钱包连接的常量配置信息就在这里

    |-components
        |-AccountDetails    // 用户账户显示界面目录
        |-index.tsx         // 用户钱包接入后的账户显示，以及操作动作触发
 ```
 


 
##### 2、添加基础安装库
 ``` shell
 yarn add @uxuycom/web3-tg-sdk
 ```

##### 3、创建连接器
 2、在src/connector.ts添加UxuyConnector.ts
 ``` typescript
import { AbstractConnector } from '@web3-react/abstract-connector'
import { ethers } from 'ethers'
import { WalletTgSdk } from '@uxuycom/web3-tg-sdk'

export class UxuyTgConnector extends AbstractConnector {
  private ethereum: any
  private provider: ethers.providers.Web3Provider | null = null

  constructor(kwargs?: any) {
    super(kwargs)
    const { ethereum } = new WalletTgSdk() // 初始化 UXUY SDK
    this.ethereum = ethereum
    this.setupListeners() // 注册事件监听
  }

  // 激活钱包连接
  public async activate(): Promise<any> {
    try {
      // 请求账户连接
      const accounts = await this.ethereum.request({ method: 'eth_requestAccounts' })
      const account = accounts[0] || null

      // 获取当前链ID
      const chainId = await this.getChainId()

      // 包装成 ethers.js 的 Web3Provider
      this.provider = new ethers.providers.Web3Provider(this.ethereum)

      return { provider: this.provider, chainId, account }
    } catch (error) {
      throw new Error(`active error`)
    }
  }

  // 获取链ID
  public async getChainId(): Promise<number | string> {
    try {
      const chainId = await this.ethereum.request({ method: 'eth_chainId' })
      return parseInt(chainId, 16)
    } catch (error) {
      throw new Error(`获取链ID失败: ${error.message}`)
    }
  }

  // 获取当前账户
  public async getAccount(): Promise<string | null> {
    try {
      const accounts = await this.ethereum.request({ method: 'eth_accounts' })
      return accounts.length > 0 ? accounts[0] : null
    } catch (error) {
      throw new Error(`获取账户失败: ${error.message}`)
    }
  }

  // 实现 getProvider 方法
  public async getProvider(): Promise<ethers.providers.Web3Provider | null> {
    return this.provider
  }

  // 断开连接
  public async deactivate() {
    try {
      // 调用断开连接的方法
      this.provider = null
      this.emitDeactivate()
      console.log('Wallet deactivated')
    } catch (error) {
      console.error('Error during wallet deactivation', error)
    }
  }

  // 监听事件：账户更改
  private handleAccountsChanged = (accounts: string[]) => {
    this.emitUpdate({ account: accounts.length === 0 ? null : accounts[0] })
  }

  // 监听事件：链ID更改
  private handleChainChanged = (chainId: string) => {
    this.emitUpdate({ chainId: parseInt(chainId, 16) })
  }

  // 注册事件监听
  private setupListeners() {
    this.ethereum.on('accountsChanged', this.handleAccountsChanged)
    this.ethereum.on('chainChanged', this.handleChainChanged)
  }
}
 ```
 
##### 4、连接器导入全局
在src/connector/index.ts 文件中 引入uxuyConnect 并在开头申明导入ux
```typescript
// 在开头添加新的uxuyConnect
import { fortmatic, injected, portis, walletconnect, uxuyConnect,walletlink } from '../connectors'
```
在支持的钱包定义里添加UXUY_CONNECT对象属性
``` typescript
export const SUPPORTED_WALLETS =
  process.env.REACT_APP_CHAIN_ID !== '1'
    ? TESTNET_CAPABLE_WALLETS
    : {
        ...TESTNET_CAPABLE_WALLETS,
        ...{
          UXUY_CONNECT: {
            connector: uxuyConnect,
            name: 'UxuyConnect',
            iconName: 'uxuyConnectIcon.svg',
            description: 'Connect to UxuyConnect..',
            href: null,
            color: '#4196FC',
            mobile: true
          },
          WALLET_CONNECT: {
            connector: walletconnect,
            name: 'WalletConnect',
            iconName: 'walletConnectIcon.svg',
            description: 'Connect to Trust Wallet, Rainbow Wallet and more...',
            href: null,
            color: '#4196FC',
            mobile: true
          },
          WALLET_LINK: {
            connector: walletlink,
            name: 'Coinbase Wallet',
            iconName: 'coinbaseWalletIcon.svg',
            description: 'Use Coinbase Wallet app on mobile device',
            href: null,
            color: '#315CF5'
          },
          COINBASE_LINK: {
            name: 'Open in Coinbase Wallet',
            iconName: 'coinbaseWalletIcon.svg',
            description: 'Open in Coinbase Wallet app.',
            href: 'https://go.cb-w.com/dFdHIRRZS8',
            color: '#315CF5',
            mobile: true,
            mobileOnly: true
          },
          FORTMATIC: {
            connector: fortmatic,
            name: 'Fortmatic',
            iconName: 'fortmaticIcon.png',
            description: 'Login using Fortmatic hosted wallet',
            href: null,
            color: '#6748FF',
            mobile: true
          },
          Portis: {
            connector: portis,
            name: 'Portis',
            iconName: 'portisIcon.png',
            description: 'Login using Portis hosted wallet',
            href: null,
            color: '#4A6C9B',
            mobile: true
          }
        }
      }
```

##### 5、将钱包logo图标添加到响应的目录
```
src\asset\images\walletConnectIcon.svg

```
##### 6、将用户账户界面，针对uxuy钱包增加操作逻辑的修改。
```
    |-components
        |-AccountDetails    // 用户账户显示界面目录
        |-index.tsx     
```

打开index.tsx 在头部引入uxuyConnect
```typescript
import { injected, walletconnect, walletlink, fortmatic, portis, uxuyConnect } from '../../connectors'
```



在账户的地方加入操作判断，有的钱包是connect 和disconnect 构造函数，而uxuyConnect是 active deactive 连接断开钱包
```typescript

//line 316
                  {connector !== injected && connector !== walletlink && (
                    <WalletAction
                      style={{ fontSize: '.825rem', fontWeight: 400, marginRight: '8px' }}
                      onClick={() => {
                        if (connector === uxuyConnect) {
                          connector.deactivate();  // UxuyConnector 使用 deactivate()
                        }else{
                          (connector as any).close()
                        }
                        
                      }}
                    >
                      Disconnect
                    </WalletAction>
                  )}

```

##### 7 处理一些细节 ，修改账户状态的钱包Logo展示
显示的账户用那个钱包连接是带有哪个图标logo的。也在这个文件里加上
``` typescript
// 找到getStatusIcon() 方法，添加<img src={UxuyConnectIcon} alt={''} />


import UxuyConnectIcon from '../../assets/images/uxuyConnectIcon.svg' 添加

//...

function getStatusIcon() {
    if (connector === injected) {
      return (
        <IconWrapper size={16}>
          <Identicon />
        </IconWrapper>
      )
    } else if (connector === uxuyConnect) {
      return (
        <IconWrapper size={16}>
          <img src={UxuyConnectIcon} alt={''} />
        </IconWrapper>
      )
    } else if(connector === walletconnect) {
      return (
        <IconWrapper size={16}>
          <img src={WalletConnectIcon} alt={''} />
        </IconWrapper>
      )
    } else if (connector === walletlink) {
      return (
        <IconWrapper size={16}>
          <img src={CoinbaseWalletIcon} alt={''} />
        </IconWrapper>
      )
    } else if (connector === fortmatic) {
      return (
        <IconWrapper size={16}>
          <img src={FortmaticIcon} alt={''} />
        </IconWrapper>
      )
    } else if (connector === portis) {
      return (
        <>
          <IconWrapper size={16}>
            <img src={PortisIcon} alt={''} />
            <MainWalletAction
              onClick={() => {
                portis.portis.showPortis()
              }}
            >
              Show Portis
            </MainWalletAction>
          </IconWrapper>
        </>
      )
    }
  }
  
  //...

```



##### 8、修改完毕，打包发布看运行效果效果 

tips:工程中如果typescript 版本低于4.5 则需要将@@uxuycom/web3-tg-sdk/dist/types/src/provider/TronLinkProvider/TronLinkProvider.d.ts
EthereumProvider.d.ts
两个中的的类型去掉 ,这是typescript4.5之后的特性，否则会报类型错误。
``` typescript
// type Account 修改为 Account 
import { Account, PROVIDER_ALLIANCE, initOptions } from "../../types";

```

一切检查修改完毕之后 

开发调试：
``` shell
yarn start  

```
生产发布：
```
yarn build
```

![效果示例](./uxuyWallet-4048a49b06.gif)

##### 9 总结
我们期待@Web3React 能加入UxuyWallet的支持，这样swap在TG 这样mooniswap 可以直接部署到 telegram miniapp中去，用户在小程序中的交易体验，将会更加丝滑。
