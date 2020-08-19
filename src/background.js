const PREZI = 'https://prezi.com'
const AUTH = 'https://prezi.com/api/v2/auth/required/'
const CREATE_FROM_URL =  PREZI + '/api/v2/library/user/favorite/create/from-url/'

const State = {
    auth: null,
    csrftoken: null
}

const setState = (path, value) => {
    _.set(State, path, value)
}

const getState = (path) => {
    return _.get(State, path)
}

const generateHeader = (auth, csrftoken) => new Headers({
    'Cookie': `prezi-auth=${auth}; csrftoken=${csrftoken};`,
    'X-csrftoken': `${csrftoken}`,
    'Content-Type': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.125 Safari/537.36'
})

setInterval(() => console.log(State), 8000)

const authenticate = async () => {
    const response = await fetch(AUTH, {
        credentials: 'include'
    })
    
   if (response.redirected){
       preziRedirect()
   } else {
        chrome.cookies.get({ url: PREZI, name:'prezi-auth' },
        cookie => {
            if(cookie !== null) {
                setState('auth', {
                    name: cookie.name,
                    value: cookie.value
                })
            } else {
                preziRedirect()
            }
        })
        chrome.cookies.get({ url: PREZI, name:'csrftoken' },
        cookie => {
            if(cookie !== null) {
                setState('csrftoken', {
                    name: cookie.name,
                    value: cookie.value
                })
            } else {
                preziRedirect()
            }
        })
   }
}

const preziRedirect = () => {chrome.tabs.create({ url: AUTH })}

const createFavorite = async (url) => {
    console.log(url)
    if(getState('auth') == null) {
        await authenticate()
    } else {
        const response = await fetch(
            CREATE_FROM_URL, {
                method: 'POST',
                headers: generateHeader(getState('auth.value'), getState('csrftoken.value')),
                body: JSON.stringify({
                    url: url,
                    favoriteType: 'image',
                    documentGeneration: '0',
                    origin: {
                        source: 'chrome_extension'
                    }
                })
            }
        )
        const responseBody = await response.json()
        console.log(responseBody)
    }
}

chrome.contextMenus.create({
    title: 'Add to Prezi Library',
    contexts: ['image'],
    onclick: async (info, __) => {
        if(info.srcUrl !== null || info.srcUrl !== undefined) {
            await createFavorite(info.srcUrl)
        }
    }
}, () => { console.log('yo') } )

authenticate()