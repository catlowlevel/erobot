FROM ubuntu
# Install Node.js, Yarn and required dependencies
RUN apt-get update \
  && apt-get install -y curl gnupg build-essential \
  && curl --silent --location https://deb.nodesource.com/setup_16.x | bash - \
  && curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add - \
  && echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list \
  && apt-get remove -y --purge cmdtest \
  && apt-get install libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev git -y \
  && apt-get update \
  && apt-get install -y nodejs yarn \
  # remove useless files from the current layer
  && rm -rf /var/lib/apt/lists/* \
  && rm -rf /var/lib/apt/lists.d/* \
  && apt-get autoremove \
  && apt-get clean \
  && apt-get autoclean

RUN adduser --disabled-password --gecos "" --uid 1000 node

USER 1000
WORKDIR /home/node

COPY package.json ./
COPY yarn.lock ./

#RUN yarn install
#https://github.com/yarnpkg/yarn/issues/2629#issuecomment-685088015
RUN yarn install --check-files --cache-folder .ycache && rm -rf .ycache
COPY . .

CMD ["yarn","dev"]