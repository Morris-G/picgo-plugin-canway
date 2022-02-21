module.exports = ctx => {
  const UPLOAD_URL = 'http://image.canwaytest.net/web/api/user/spaces/{userId}/images'
  const register = () => {
    ctx.helper.uploader.register('canway', {
      handle,
      name: '嘉为图床',
      config: config
    })
  }
  const handle = async function (ctx) {
    ctx.log.info('======= picgo-plugin-canway =======')
    const userConfig = ctx.getConfig('picBed.canway')
    if (!userConfig) {
      throw new Error("Can't find uploader config")
    }
    const token = userConfig.token
    const params = {
      autoRename: (userConfig.duplicate.value === 0) + '',
      isCover: (userConfig.duplicate.value === 1) + ''
    }
    try {
      const imgList = ctx.output
      for (const img of imgList) {
        let image = img.buffer
        if (!image && img.base64Image) {
          image = Buffer.from(img.base64Image, 'base64')
        }
        const postConfig = postOptions(image, img.fileName, token, params, userConfig.userId)
        let body = await ctx.Request.request(postConfig)
        delete img.base64Image
        delete img.buffer
        ctx.log.info(body)
        body = JSON.parse(body)
        const { code, data } = body
        if (code === 0) {
          img['imgUrl'] = data.originalUrl
        } else {
          throw new Error(body.message)
        }
      }
      return ctx
    } catch (err) {
      const content = {
        title: '上传失败',
        body: err.message
      }
      ctx.log.error(err)
      ctx.emit('notification', content)
    }
  }

  const postOptions = (image, fileName, token, params, userId) => {
    let headers = {
      contentType: 'multipart/form-data',
      'User-Agent': 'PicGo',
      Authorization: token
    }

    let formData = {
      imageFile: {
        value: image,
        options: {
          filename: fileName
        }
      },
      ...params
    }
    const opts = {
      method: 'POST',
      url: UPLOAD_URL.replace('{userId}', userId),
      headers: headers,
      formData
    }

    return opts
  }

  const config = ctx => {
    let userConfig = ctx.getConfig('picBed.canway')
    if (!userConfig) {
      userConfig = {}
    }
    return [
      {
        name: 'userId',
        type: 'input',
        default: userConfig.userId,
        required: true,
        message: '用户名',
        alias: '用户名'
      },
      {
        name: 'token',
        type: 'input',
        default: userConfig.token,
        required: true,
        message: '个人秘钥',
        alias: '个人秘钥'
      },
      {
        name: 'duplicate',
        type: 'list',
        default: userConfig.duplicate,
        required: true,
        message: '存在重名图片时，将使用此方式处理',
        alias: '重名处理',
        choices: [
          { name: '自动重命名', value: 0 },
          { name: '覆盖同名文件', value: 1 }
        ]
      }
    ]
  }
  return {
    uploader: 'canway',
    register
  }
}
