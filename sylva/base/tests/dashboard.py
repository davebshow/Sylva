from django.test import LiveServerTestCase

from splinter import Browser

from user import signup, signin, logout


def create_graph(test):
    test.browser.visit(test.live_server_url + '/graphs/create/')
    text = test.browser.find_by_xpath(
        "//header[@class='global']/h2").first.value
    test.assertNotEqual(text.find('Create New Graph'), -1)
    test.assertEqual(text, 'Create New Graph')
    test.browser.find_by_name('name').first.fill("Bob's graph")
    test.browser.find_by_xpath(
        "//form[@name='graphs_create']/p/textarea[@name='description']").first.fill('The loved graph')
    test.browser.find_by_name('addGraph').first.click()
    text = test.browser.find_by_xpath(
        "//header[@class='global']/h1").first.value
    test.assertEqual(text, 'Dashboard')
    text = test.browser.find_link_by_href(
        '/graphs/bobs-graph/').first.value
    test.assertEqual(text, "Bob's graph")


def create_schema(test):
    test.browser.find_link_by_href(
        '/graphs/bobs-graph/').first.click()
    test.assertEqual(test.browser.title, "SylvaDB - Bob's graph")
    test.browser.find_link_by_href(
        '/schemas/bobs-graph/').first.click()
    text = test.browser.find_by_xpath(
        "//div[@class='body-inside']/p").first.value
    test.assertEqual(text, 'There are no types defined yet.')


def create_type(test):
    """
    Improve comment. For use it after create_schema().
    """
    test.browser.find_link_by_href(
        '/schemas/bobs-graph/types/create/').first.click()
    text = test.browser.find_by_xpath(
        "//div[@class='content2-first']/h2").first.value
    test.assertEqual(text, 'Type')
    test.browser.find_by_name('name').first.fill("Bob's type")
    test.browser.find_by_xpath(
        "//div[@class='content2-first']/p/textarea[@name='description']").first.fill('The loved type')
    test.browser.find_by_name('properties-0-key').first.fill('Name')
    test.browser.find_by_name('properties-0-display').first.check()
    test.browser.find_by_value('Save Type').first.click()
    text = test.browser.find_by_id(
        'diagramBoxField_bobs-graph.bobs-type.undefined').first.value
    test.assertEqual(text, "Name")


def create_data(test):
    """
    Improve comment. For use it after create_type().
    """
    test.browser.find_by_id('dataMenu').first.click()
    test.browser.find_by_xpath(
        "//a[@class='dataOption new']").first.click()
    text = test.browser.find_by_id('propertiesTitle').first.value
    test.assertEqual(text, 'Properties')
    test.browser.find_by_name('Name').first.fill("Bob's node")
    test.browser.find_by_value("Save Bob's type").first.click()
    text = test.browser.find_by_xpath("//div[@class='pagination']/span[@class='pagination-info']").first.value
    # The next line must be more 'specific' when we can destroy Neo4j DBs
    test.assertNotEqual(text.find(" elements Bob's type."), -1)


class DashboardTestCase(LiveServerTestCase):

    def setUp(self):
        self.browser = Browser('phantomjs')
        signup(self, 'bob', 'bob@cultureplex.ca', 'bob_secret')
        signin(self, 'bob', 'bob_secret')

    def tearDown(self):
        logout(self)
        self.browser.quit()

    def test_dashboard(self):
        self.assertEquals(self.browser.title, 'SylvaDB - Dashboard')
        text = self.browser.find_by_xpath(
            "//header[@class='global']/h1").first.value
        self.assertEqual(text, 'Dashboard')

    def test_dashboard_new_graph(self):
        create_graph(self)

    def test_dashboard_graph_preview(self):
        create_graph(self)
        create_schema(self)
        create_type(self)
        create_data(self)
        self.browser.find_link_by_href('/graphs/bobs-graph/').first.click()
        self.browser.find_by_id('visualization-type').first.click()
        self.browser.find_by_id('visualization-sigma').first.click()
        sigma = self.browser.find_by_id('sigma-wrapper').first
        self.assertEqual(sigma['style'], 'display: block; ')
        js_code = '''
            var instanceId = '0';
            for (key in sigma.instances) {
                instanceId = key;
                break;
            }
            var instance = sigma.instances[instanceId];
            var nodeId = '0';
            for (key in sylva.total_nodes) {
                nodeId = key;
                break;
            }
            sigma.test_node_id = instance.getNodes(nodeId).id;
            '''
        self.browser.execute_script(js_code)
        text = self.browser.evaluate_script('sigma.test_node_id')
        self.assertNotEqual(text.find("Bob's node"), -1)
