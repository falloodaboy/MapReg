FROM node:latest

LABEL AUTHOR="Zohaib Wasim"

ENV MODE=dev

RUN mkdir -p '/app/proj'

WORKDIR /app/proj

RUN npx create-next-app@latest --ts nextproj

WORKDIR /app/proj/nextproj

EXPOSE 3000

COPY ./nextproj /app/proj/nextproj/

#RUN if [$MODE = prod] ; then npm run build

CMD  npm run $MODE
