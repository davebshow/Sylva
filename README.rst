.. image:: https://travis-ci.org/CulturePlex/Sylva.png?branch=develop
  :target: https://travis-ci.org/CulturePlex/Sylva

.. image:: https://coveralls.io/repos/CulturePlex/Sylva/badge.png?branch=develop
  :target: https://coveralls.io/r/CulturePlex/Sylva?branch=develop

.. image:: https://landscape.io/github/CulturePlex/Sylva/develop/landscape.svg?style=flat
  :target: https://landscape.io/github/CulturePlex/Sylva/develop
  :alt: Code Health

Sylva
==========
Sylva_ is a Relaxed-Schema Graph Database Management System.

Installation:
-------------

Just in case, first thing you need is to have installed pip_ and virtualenv_ in your machine::

  $ sudo apt-get install python-pip python-dev build-essential python-profiler libpq-dev
  $ sudo pip install --upgrade pip
  $ sudo pip install --upgrade virtualenv

Then, it's a good option to use virtualenvwrapper_::

  $ sudo pip install virtualenvwrapper

In the instructions given on virtualenvwrapper_, you should to set the working
directory for your virtual environments. So, you could add it in the end of
your .bashrc file (newer versions of virtualenvwrapper don't require this)::

  $ mkdir -p ~/.venvs
  export WORKON_HOME=~/.venvs
  source /usr/local/bin/virtualenvwrapper.sh

And finally, create a virtualenv for the project::

  $ mkvirtualenv sylva --no-site-packages

After you setup your virtual environment, you should be able to enable and
disable it. The system propmt must change where you have it enable::

  $ workon sylva
  $ deactivate

Now, if you didn't get the project yet, clone it in your desired location::

  $ cd $HOME
  $ git clone git@github.com:CulturePlex/sylva.git git/sylva

Enter in the new location and update the virtual environment previously created::

  $ cd git/sylva/
  $ workon sylva
  $ pip install -U -r requirements.txt

Relational Database
-------------------

Now you have installed the Django_ project and almost ready to run it. Before that,
you must create a database. In developing stage, we use SQLite::

  $ cd $HOME
  $ cd sylva/sylva
  $ python manage.py syncdb --noinput
  $ python manage.py migrate
  $ python manage.py createsuperuser

And that is. If you run the project using the standalone development server of
Django_, you could be able to access to the URL http://localhost:8000/::

  $ python manage.py runserver localhost:8000
  $ xdg-open http://localhost:8000/

Graph Database
--------------

The last piece to make Sylva works is the Neo4j_ graph database. You can download
the most current version (only branch 1.9.x is supported, 1.9.9_ as today).
After downloading, we need to unzip and setup some parameters::

  $ cd git/sylva
  $ wget dist.neo4j.org/neo4j-community-1.9.9-unix.tar.gz
  $ tar -zxvf neo4j-community-1.9.9-unix.tar.gz
  $ mv neo4j-community-1.9.9-unix neo4j

Now, as indicated in `settings.py` in section `GRAPHDATABASES`, you need to edit
the file `neo4j/conf/neo4j-server.properties` and set the next properies (the
default configuration is reserved for testing client libraries)::

  org.neo4j.server.webserver.port=7373
  org.neo4j.server.webadmin.data.uri=/db/sylva/

And then you are ready to run the Neo4j_ server::

  $ ./neo4j/bin/neo4j console

Analytics
---------

The analytics feature is only available for Neo4j backend, and only supportyed
in 64-bits machines due to a limitiation in GraphLab_. To enable them, set the
next variable to `True` in your local `settings.py`::

  ENABLE_ANALYTICS = True

Analytics are run as Celery_ tasks, so you need a broker and a backend. Of popular
choice is to install Redis_ as the results backend, and RabbitMQ_ as the broker.
But in order to simplify the process, just the broker is needed when using RabbitMQ.

There are many ways to install RabbitMQ, we recommend a system installation,
although a local installation might be better for development::

  $ wget http://www.rabbitmq.com/releases/rabbitmq-server/v3.3.1/rabbitmq-server-generic-unix-3.3.1.tar.gz
  $ tar xvf rabbitmq-server-generic-unix-3.3.1.tar.gz
  $ ./rabbitmq_server-3.3.1/sbin/rabbitmq-server start

That should expose the URL amqp://guest@localhost// listening for requests,
which is the default `BROKER_URL` in the settings. But if you are using a
different broker or result backend, don't forget to configure those in your
local settings::

  BROKER_URL = "amqp://user:pass@hostname/app/"
  CELERY_RESULT_BACKEND = "redis://:password@hostname:port/db"

Then export the settings if it's not the regular `settings.py` file::

  $ export DJANGO_SETTINGS_MODULE=sylva.your_settings

And finally run Celery::

  $ celery -A sylva.celery worker -l info

You can also run it in daemon mode by passing the argument `multi`::

  $ celery multi start w1 w2 -A sylva.celery -l info

Reports
-------
Sylva now supports generation of reports based on queries plot into charts. To enable, just add::

  ENABLE_REPORTS = True

And remember to add the celery beat::

  $ celery --beat -A sylva.celery worker -l info

When in daemon mode, be sure to only run the beat once, otherwise you'll have duplicated tasks::

  $ celery multi start w1 --beat -A sylva.celery -l info
  $ celery multi start w2 -A sylva.celery -l info

Support for Tinkerpop3/Gremlin Server (Experimental)
----------------------------------------------------

The SylvaDB community is in the process of adding support for `Tinkerpop3`_ enabled
graph databases that use the Gremlin Server for communication.

Currently, SylvaDB includes optional experimental support for `Titan`_ graph database.

If you would like to try out the Titan implementation, please follow the
steps provided in this README regarding installing SylvaDB requirements and
the relational database until you arrive at the section titled "Graph Database".
Then continue as follows:

First install gremlinrestclient, the client used to connect to the Gremlin Server::

    $ pip install gremlinrestclient

Next download and unpack the 3.0.0.M9 Gremlin Server::

    $ cd git/Sylva
    $ wget http://s3.thinkaurelius.com/downloads/titan/titan-0.9.0-M2-hadoop1.zip
    $ unzip titan-0.9.0-M2-hadoop1.zip
    $ mv titan-0.9.0-M2-hadoop1.zip titan

Then you will have to update the config a bit. In
`conf/gremlin-server/gremlin-server.yaml` change::

    channelizer: org.apache.tinkerpop.gremlin.server.channel.WebSocketChannelizer

to::

    channelizer: org.apache.tinkerpop.gremlin.server.channel.HTTPChannelizer

Finally, we need to configure SylvaDB to run the proper backend. In the
whatever settings file you use to run SylvaDB, you can simply change the
GRAPHDATABASES default graph settings to the following::

    'default': {
        'ENGINE': 'engines.gdb.backends.titan',
        'NAME': '',
        'USER': '',
        'PASSWORD': '',
        'SCHEMA': 'http',
        'HOST': 'localhost',
        'PORT': '8182',
    }

Titan currently does not support the `reports`, `queries` or `analytics`
applications. This support will be added in the near future.
Please disable these applications in your settings::

    ENABLE_QUERIES = False
    ENABLE_REPORTS = False
    ENABLE_REPORTS_PDF = False
    ENABLE_ANALYTICS = False

Finally, run SylvaDB's dev server as per usual
(with whatever settings you configured for TP3) and fire up Titan (using the
Gremlin Server)::

    $ ./titan/bin/gremlin-server.sh


.. _Sylva: http://www.sylvadb.com
.. _Neo4j: http://neo4j.org
.. _1.9.9: http://dist.neo4j.org/neo4j-community-1.9.9-unix.tar.gz
.. _Django: https://www.djangoproject.com/
.. _GraphLab: http://graphlab.com/
.. _RabbitMQ: http://www.rabbitmq.com/
.. _Celery: http://celery.readthedocs.org/en/latest/
.. _Redis: http://redis.io/
.. _pip: http://pypi.python.org/pypi/pip
.. _virtualenv: http://pypi.python.org/pypi/virtualenv
.. _virtualenvwrapper: http://www.doughellmann.com/docs/virtualenvwrapper/
.. _tinkerpop3: http://tinkerpop.incubator.apache.org/
.. _tinkergraph: http://tinkerpop.incubator.apache.org/docs/3.0.0.M9-incubating/#tinkergraph-gremlin
.. _Titan: http://s3.thinkaurelius.com/docs/titan/0.9.0-M2/
