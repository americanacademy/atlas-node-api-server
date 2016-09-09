## A RESTful web server for querying the Science Policy Atlas database

### Search API endpoint
**[Demo - search "American Society"](https://ancient-eyrie-85680.herokuapp.com/api/v0/search/?q=American%20Society)**

**Description:** Search the atlas for a collaborations and organizations. Returns an array of objects sorted by relevance.

**Note:** If query parameters aren't specified, the default values are used and the endpoint returns an alphabetically
sorted array of collaborations and organizations.

**<code>GET</code> [https://ancient-eyrie-85680.herokuapp.com/api/v0/search/](https://ancient-eyrie-85680.herokuapp.com/api/v0/search)**

#### Query parameters (optional)

| Name | Syntax    | Input | Result | Default value |
| ---- |-----------|-------| ------ | ------------- |
| q | /?q=american | A String | objects related to q | <code>""</code> |
| qType | /?qType=collaborations| <code>collaborations</code> or <code>organizations</code> | objects of type qType | <code>""</code> |
| page| /?page=2 | A Positive Number (1, 2, 3, etc..) | nth array of result search (where n == page) | <code>1</code> |
| pageCount | /?pageCount=true | <code>true</code> or <code>false</code> | number of pages for given query | <code>false</code> |
| maxResults | /?maxResults=20  | A Positive Number | result array will be of length maxResults | <code>10</code> |
| states | /?states[]=missouri&states[]=NY | An Array of Strings | results will be in state1 <code>&#124;&#124;</code> state2 <code>&#124;&#124;</code> etc.. | <code>[]</code> |
| country | /?cities[]=San%20Francisco&cities[]=boston | An Array of Strings | results will be in country1 <code>&#124;&#124;</code> country2 <code>&#124;&#124;</code> etc.. | <code>[]</code> |
