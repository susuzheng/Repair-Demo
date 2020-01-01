# Repair-Demo

Please use command <code>git clone --recurse-submodules https://github.com/susuzheng/Repair-Demo.git</code> to download.

Go to <code>/SpuriousTuplesWebApp</code> and run <code>sh runTestServer.sh [path to the csv file] [number of attributes] [hasHeader] 9876</code>. (e.g. <code>sh runTestServer.sh Dataset/Adult/adult.csv 15 false 9876</code>)<br />
After it shows to be all set, use another shell and go to <code>/Drawing JD Tree</code> and run <code>npm start</code> (For the first time running, please run <code>npm install</code> before starting).<br />
Then you're ready to go!
Note: Sample separator files are contained in the same folder as the datasets. More details please check <code>Sample\ Pics/description.txt</code>

Measurements in the upper-right color has 2 possible colors: green & red.<br />
Green means the data are up-to-date.<br />
Red means the data are still being calculated and the presented data may be wrong.<br />
