import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Redis from 'ioredis'

@Injectable()
export class RedisService {
  private client: Redis

  constructor(private configService: ConfigService) {
    this.client = new Redis({
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379)
    })
  }

  public async onModuleInit() {
    await this.client.ping()
    console.log('Redis connected')
  }

  public async onModuleDestroy() {
    await this.client.quit()
  }

  // 값 조회
  public async get<T>(key: string): Promise<T | null> {
    const data = await this.client.get(key)
    return data ? (JSON.parse(data) as T) : null
  }

  // 값 저장
  public async set(key: string, value: any, ttl: number): Promise<string> {
    const result = await this.client.set(key, JSON.stringify(value), 'EX', ttl)
    if (result !== 'OK') {
      throw new Error(`Failed to set key ${key}, result: ${result}`)
    }
    return result
  }

  // 키 삭제 (키가 없어도 실패로 간주하지 않음)
  public async del(key: string): Promise<number> {
    const result = await this.client.del(key)
    return result // 0일 경우도 정상 반환
  }

  public async keys(pattern: string): Promise<string[]> {
    return await this.client.keys(pattern)
  }
}
