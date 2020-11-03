import config from '../config'

interface ServerlessEnvVars extends NodeJS.ProcessEnv {
  stage: string
  tableName: string
  awsApiKey?: string
  awsSecret?: string
  awsRegion: string
}

const extenedConfig = {
  ...config,
  serverless: {
    // eslint-disable-next-line node/no-process-env -- why not
    ...(process.env as ServerlessEnvVars),
  },
}

export default extenedConfig
