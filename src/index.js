module.exports = ctx => {
  const UPLOAD_URL = 'http://172.16.12.95:25902/api/user/images/'
  const register = () => {
    ctx.helper.uploader.register('canway', {
      handle,
      name: '嘉为蓝鲸图床',
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
      autoRename: userConfig.autoRename + '',
      isCover: userConfig.isCover + ''
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
        body = JSON.parse(body)
        const { code, message, data } = body
        if (code === 0) {
          img['imgUrl'] = data.url
        } else {
          throw new Error(message)
        }
      }
      return ctx
    } catch (err) {
      const content = {
        title: '上传失败',
        body: err.message
      }
      ctx.log.error(JSON.stringify(content))
      ctx.emit('notification', content)
    }
  }

  const postOptions = (image, fileName, token, params, userId) => {
    let headers = {
      contentType: 'multipart/form-data',
      'User-Agent': 'PicGo',
      'X_DEVOPS_USER_TOKEN':
        'qbZeCYAYhr9S9hMlSP0M3KOKODq131oh_NOrG4Kdi0rFtBtEeHxcGOKlF2BoSuGTtnqLv4yyXyT9Z5ai_jdgqEpQf7ODcnwPpYVyU_sHhxBGMWi_PS4V1LABkq0q4GNqJrkuTCLas4rmjafTETM7ivv5UozG-wJsWQqPwKiGSaidAHiT_AkH2RMVxwN6V_F92xI3cIIRsp91FEf-uwqqF0ECAGw75PrdhmS-7HAT16EGb3REj7WkTSFfDS-kYv9oT1M8VJ2HxWdf16duwPUdQ_BKDBL8SkWc27CNaUCcuV30h6GrdRulqiu-0bV0oL5YfuJlSWu21Coui7m77sBdajJuGuOZD5VmEalvDG5dExx14lp-rGMmJGdHSFIgH6h4pzvsdsQhUaouw0LqR_8fBUsfxRgZznTMFZmAUp82Ld3xucTBQgEjMSx13uaHNNtSt6uxX2n4qOe1HexHs_rFFEX4bD_mUXVcHK2nrq1xBYM',
      'X-DEVOPS-UID': 'Adam'
    //   Authorization: token
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
      url: UPLOAD_URL + userId,
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
        name: 'autoRename',
        type: 'confirm',
        default: userConfig.autoRename,
        required: true,
        message: '存在重名图片时，是否自动重命名',
        alias: '自动重命名'
      },
      {
        name: 'isCover',
        type: 'confirm',
        default: userConfig.isCover,
        required: true,
        message: '存在重名图片时，是否覆盖同名文件',
        alias: '覆盖同名文件'
      }
    ]
  }
  return {
    uploader: 'canway',
    register
  }
}
