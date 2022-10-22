const yaml = require('js-yaml')
const fs = require('fs')

const defaultEnv = 'development'
const env = process.env.NODE_ENV || defaultEnv
const conf = yaml.load(fs.readFileSync(`configuration/${env}.yaml`))

module.exports= {...conf}


