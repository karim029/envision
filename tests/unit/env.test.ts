import { parseEnv } from "@/env";
import { describe, expect, it } from "vitest";




describe('ParseEnv', ()=>{
    it('returns a typed env for valid input',()=>{
        expect(parseEnv({NODE_ENV:'production'})).toEqual({NODE_ENV: 'production'})
    })
    it('defaults NODE_ENV to development when missing',()=>{
        expect(parseEnv({}).NODE_ENV).toBe('development')
    })
    it('drops keys that are not in the schema',()=>{
        expect(parseEnv({NODE_ENV:'test', SECRET_NOT_DECLARED:'x'})).toEqual({NODE_ENV: 'test'})
    })
    it('throws a readable error that names the invalid key',()=>{
        expect(()=> parseEnv({NODE_ENV:'banana'})).toThrow(/NODE_ENV/)
    })
})