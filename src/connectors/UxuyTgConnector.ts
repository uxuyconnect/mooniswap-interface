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
