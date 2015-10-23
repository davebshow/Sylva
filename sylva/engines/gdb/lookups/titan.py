# -*- coding: utf-8 -*-
from engines.gdb.lookups import BaseQ


class Q(BaseQ):

    def _get_lookup_and_match(self):
        if self.lookup in ["exact", "iexact"]:
            lookup = "eq"
            match = "{0}".format(self.match)
        elif self.lookup in ["contains", "icontains"]:
            # This behaviour is weird, textContains only works for tokenized
            # words maybe ask about this on the list
            lookup = "textContains"
            match = "{0}".format(self.match)
        elif self.lookup in ["startswith", "istartswith"]:
            lookup = "textPrefix"
            match = "{0}".format(self.match)
        elif self.lookup in ["endswith", "iendswith"]:
            lookup = "textRegex"
            match = ".*{0}".format(self.match)
        elif self.lookup in ["regex", "iregex"]:
            lookup = "textRegex"
            match = "{0}".format(self.match)
        elif self.lookup == "gt":
            lookup = "gt"
            match = "{0}".format(self.match)
        elif self.lookup == "gte":
            lookup = "gte"
            match = "{0}".format(self.match)
        elif self.lookup == "lt":
            lookup = "lt"
            match = "{0}".format(self.match)
        elif self.lookup == "lte":
            lookup = "lte"
            match = "{0}".format(self.match)
        elif self.lookup == "in":
            lookup = "inside"
            match = "{0}".format(self.match)
        elif self.lookup == "inrange":
            lookup = "inside"
            match = "{0}".format(self.match)
        elif self.lookup == "isnull":
            if self.match:
                lookup = "eq"
            else:
                lookup = "neq"
            match = "null"
        elif self.lookup in ["eq", "equals"]:
            lookup = "eq"
            match = "{0}".format(self.match)
        elif self.lookup in ["neq", "notequals"]:
            lookup = "neq"
            match = "{0}".format(self.match)
        else:
            lookup = self.lookup
            match = ""
        print("WTFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFf")
        return lookup, match

    def get_query_objects(self, prefix=None, params=None):
        if prefix is None:
            prefix = ""
        if params is None:
            params = {}
        if self._and is not None:
            left_and = self._and[0].get_query_objects(params=params)
            params.update(left_and[1])
            right_and = self._and[1].get_query_objects(params=params)
            params.update(right_and[1])
            if self._and[0].is_valid() and self._and[1].is_valid():
                query = "and({0}, {1})".format(left_and[0], right_and[0])
            elif self._and[0].is_valid() and not self._and[1].is_valid():
                query = "{0}".format(left_and[0])
            elif not self._and[0].is_valid() and self._and[1].is_valid():
                query = "{0}".format(right_and[0])
            else:
                query = u""
        elif self._not is not None:
            op_not = self._not.get_query_objects(params=params)
            params.update(op_not[1])
            # I'm not sure about this behavior
            query = "negate({0})".format(op_not[0])
        elif self._or is not None:
            left_or = self._or[0].get_query_objects(params=params)
            params.update(left_or[1])
            right_or = self._or[1].get_query_objects(params=params)
            params.update(right_or[1])
            if self._or[0].is_valid() and self._or[1].is_valid():
                query = "or({0},{1})".format(left_or[0], right_or[0])
            elif self._or[0].is_valid() and not self._or[1].is_valid():
                query = "{0}".format(left_or[0])
            elif not self._or[0].is_valid() and self._or[1].is_valid():
                query = "{0}".format(right_or[0])
            else:
                query = " "
        else:
            query = ""
            lookup, match = self._get_lookup_and_match()
        if self.property is not None:
            key = "{0}p{1}".format(prefix, len(params))
            params[key] = match
            query_format = u"has('{0}', {1}({2}))"
            query = query_format.format(self.property, lookup, key)
        return query, params
