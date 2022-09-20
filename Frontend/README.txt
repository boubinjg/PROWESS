Requirements:
    Apache http Web Server >=v2.4
    Shibboleth >=v3.2

Configuration:
    To configure the web frontent, first, follow the instructions for configuring web services with apache.
        Note: ensure that you configure your new site to allow for ssl:
            Ex using sites-available: SSLProxyEngine On


    Next, assure that you have configured shibboleth for your service. Add an appropriate .htaccess
    file to the http/ directory of your configured apache service

    Last, assure that your domain and backend port (default 3001) are added to the Frontend/src/config.JSON file.

Deployment:

This web frontend is implemented in react and relies on the PROEWSS backend and experiment database. For full functionality, you must also deploy the backend and database correctly. To deploy this frontent, you can use the following sample commands:

npm run build
sudo cp -r build/* {PATH_TO_DOCUMENT_ROOT}
sudo service httpd restart
sudo service shibd restart

Note that {PATH_TO_DOCUMENT_ROOT} is the path to the document root of your web service as described in it's apache configuration files.

Once correctly configured, this web service should appear at it's specified domain behind your organization's shibboleth SSO service.
