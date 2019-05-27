# vim: ft=python fileencoding=utf-8 sts=4 sw=4 et:

# Copyright 2014-2019 Florian Bruhin (The Compiler) <mail@qutebrowser.org>
#
# This file is part of qutebrowser.
#
# qutebrowser is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# qutebrowser is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with qutebrowser.  If not, see <http://www.gnu.org/licenses/>.

"""Utilities related to jinja2."""

import os
import typing
import functools
import os.path
import contextlib
import html

import jinja2
from PyQt5.QtCore import QUrl

from qutebrowser.utils import utils, urlutils, log, qtutils


html_fallback = """
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Error while loading template</title>
  </head>
  <body>
    <p><span style="font-size:120%;color:red">
    The %FILE% template could not be found!<br>
    Please check your qutebrowser installation
      </span><br>
      %ERROR%
    </p>
  </body>
</html>
"""


class Loader(jinja2.BaseLoader):

    """Jinja loader which uses utils.read_file to load templates.

    Attributes:
        _subdir: The subdirectory to find templates in.
    """

    def __init__(self, subdir):
        self._subdir = subdir

    def get_source(self, _env, template):
        path = os.path.join(self._subdir, template)
        try:
            source = utils.read_file(path)
        except OSError as e:
            source = html_fallback.replace("%ERROR%", html.escape(str(e)))
            source = source.replace("%FILE%", html.escape(template))
            log.misc.exception("The {} template could not be loaded from {}"
                               .format(template, path))
        # Currently we don't implement auto-reloading, so we always return True
        # for up-to-date.
        return source, path, lambda: True


class Environment(jinja2.Environment):

    """Our own jinja environment which is more strict."""

    def __init__(self):
        super().__init__(loader=Loader('html'),
                         autoescape=lambda _name: self._autoescape,
                         undefined=jinja2.StrictUndefined)
        self.globals['resource_url'] = self._resource_url
        self.globals['file_url'] = urlutils.file_url
        self.globals['data_url'] = self._data_url
        self.globals['qcolor_to_qsscolor'] = qtutils.qcolor_to_qsscolor
        self._autoescape = True

    @contextlib.contextmanager
    def no_autoescape(self):
        """Context manager to temporarily turn off autoescaping."""
        self._autoescape = False
        yield
        self._autoescape = True

    def _resource_url(self, path):
        """Load images from a relative path (to qutebrowser).

        Arguments:
            path: The relative path to the image
        """
        image = utils.resource_filename(path)
        return QUrl.fromLocalFile(image).toString(QUrl.FullyEncoded)

    def _data_url(self, path):
        """Get a data: url for the broken qutebrowser logo."""
        data = utils.read_file(path, binary=True)
        filename = utils.resource_filename(path)
        mimetype = utils.guess_mimetype(filename)
        return urlutils.data_url(mimetype, data).toString()

    def getattr(self, obj, attribute):
        """Override jinja's getattr() to be less clever.

        This means it doesn't fall back to __getitem__, and it doesn't hide
        AttributeError.
        """
        return getattr(obj, attribute)


def render(template, **kwargs):
    """Render the given template and pass the given arguments to it."""
    return environment.get_template(template).render(**kwargs)


environment = Environment()
js_environment = jinja2.Environment(loader=Loader('javascript'))


@functools.lru_cache()
def template_config_variables(template: str) -> typing.FrozenSet[str]:
    """Return a frozenset of config variables that is used in template."""
    # A mapping from node -> config option name
    node_to_str = {}

    # A set of leaf strings (for example there are conf.a.b and conf.a.b.c then
    # conf.a.b won't be in the set)
    leaves = set()

    for node in reversed(list(
            environment.parse(template).find_all(jinja2.nodes.Getattr))):
        # get a list of nodes representing each prefix of a conf access
        # for example: conf.a.b.c, conf.a.b, conf.a
        # shorter prefix are listed later in find_all output, and is iterated
        # over earlier
        if isinstance(node.node, jinja2.nodes.Name):
            if node.node.name != 'conf':
                continue
            node_to_str[node] = node.attr
        else:
            # This node may be conf.a.b.c. Let base be the part with last part
            # removed (conf.a.b in the example)
            if node.node not in node_to_str:
                continue

            base = node_to_str[node.node]
            if base in leaves:
                leaves.remove(base)

            node_str = base + '.' + node.attr
            node_to_str[node] = node_str
            leaves.add(node_str)

    return frozenset(leaves)
