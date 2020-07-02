const Apify = require('apify');
const { EnumBaseUrl, EnumURLTypes } = require('./constants');

const { log } = Apify.utils;
log.setLevel(log.LEVELS.DEBUG);

exports.log = log;

exports.getSearchUrl = ({ search, type }) => {
    const searchType = type === 'posts' ? 'link' : 'sr,user';

    const params = new URLSearchParams([
        ['q', search],
        ['type', searchType],
    ]);
    return `${EnumBaseUrl.SEARCH_URL}?${params.toString()}`;
};

exports.getUrlType = (url) => {
    let type = null;

    const [, params] = url.split('?');

    const searchParameters = new URLSearchParams(params);

    if (url.match(/www\.reddit\.com\/search\/.*$/)) {
        if (searchParameters.get('type') === 'link') {
            type = EnumURLTypes.POSTS;
        }

        if (searchParameters.get('type') === 'sr,user') {
            type = EnumURLTypes.COMUMUNITIES_AND_USERS;
        }
    }

    if (url.match(/www\.reddit\.com\/r\/.+\/comments\/.*$/)) {
        type = EnumURLTypes.COMMENTS;
    }

    if (url.match(/reddit.com\/r\/([^/]+)\/$/)) {
        type = EnumURLTypes.COMMUNITY;
    }

    if (url.match(/reddit.com\/r\/([^/]+)\/[^/]+\/?$/)) {
        type = EnumURLTypes.COMMUNITY_CATEGORY;
    }

    return type;
};

exports.splitUrl = (url) => url.split('?')[0];

exports.gotoFunction = async ({ page, request }) => {
    await page.setRequestInterception(true);

    page.on('request', (req) => {
        const url = req.url();
        const resourceType = req.resourceType();
        const ignoredTypes = [
            'image',
            'font',
        ];

        const ignored = [
            'doubleclicks',
        ];

        let abort = ignoredTypes.includes(resourceType);
        if (!abort) abort = ignored.some((item) => url.includes(item));

        if (abort) {
            req.abort();
        } else {
            req.continue();
        }
    });

    return page.goto(request.url, { timeout: 60000 });
};

exports.convertStringToNumber = (stringNumber) => {
    const number = stringNumber
        .replace('k', '000')
        .replace('m', '000000')
        .replace(/[^\d]+/, '');
    return Number(number);
};
