import requests
from zipfile import ZipFile
from StringIO import StringIO

from django.test import LiveServerTestCase

from splinter import Browser

from user import signup, signin, logout
from dashboard import create_graph, create_schema, create_type, create_data


def create_node(test, name):
    test.browser.find_by_id('dataMenu').first.click()
    test.browser.find_by_xpath(
        "//a[@class='dataOption new']").first.click()
    text = test.browser.find_by_id('propertiesTitle').first.value
    test.assertEqual(text, 'Properties')
    test.browser.find_by_name('Name').first.fill(name)
    test.browser.find_by_xpath("//span[@class='buttonLinkOption buttonLinkLeft']/input").first.click()
    text = test.browser.find_by_xpath("//div[@class='pagination']/span[@class='pagination-info']").first.value
    # The next line must be more 'specific' when we can destroy Neo4j DBs
    test.assertNotEqual(text.find(" elements Bob's type."), -1)


class DataNodeTestCase(LiveServerTestCase):

    def setUp(self):
        self.browser = Browser('phantomjs')
        signup(self, 'bob', 'bob@cultureplex.ca', 'bob_secret')
        signin(self, 'bob', 'bob_secret')

    def tearDown(self):
        logout(self)
        self.browser.quit()

    def test_data_node_addition(self):
        create_graph(self)
        create_schema(self)
        create_type(self)
        create_data(self)
        # Check the node name
        self.browser.find_by_xpath("//td[@class='dataList']/a[@class='edit']").first.click()
        text = self.browser.find_by_id('propertiesTitle').first.value
        self.assertEqual(text, 'Properties')
        self.browser.find_by_xpath("//span[@class='buttonLinkOption buttonLinkRight']/a").first.click()
        self.browser.choose('confirm', '1')
        self.browser.find_by_value('Continue').first.click()
        text = self.browser.find_by_xpath("//div[@class='indent']/div").first.value
        self.assertEqual(text, 'Nodes: 0')

    def test_data_node_addition_rel_add_del(self):
        create_graph(self)
        create_schema(self)
        create_type(self)
        create_node(self, "Bob")
        create_node(self, "John")
        # We create a allowed relation
        self.browser.find_link_by_href('/schemas/bobs-graph/').first.click()
        self.browser.find_by_id('allowedRelations').first.click()
        self.browser.select('source', '1')
        self.browser.find_by_name('name').fill('Bob\'s rel')
        self.browser.select('target', '1')
        self.browser.find_by_id('id_description').fill('This the allowed relationship for Bob\'s graph')
        self.browser.find_by_value('Save Type').first.click()
        self.assertEqual(self.browser.title, "SylvaDB - Bob's graph")
        # We create the link between the nodes
        self.browser.find_by_id('dataMenu').first.click()
        self.browser.find_by_xpath("//td[@class='dataActions']/a[@class='dataOption list']").first.click()
        self.browser.find_by_xpath("//td[@class='dataList']/a[@class='edit']").first.click()
        self.browser.find_by_xpath("//li[@class='token-input-input-token']/input").first.fill('John')
        self.browser.is_element_present_by_id("id_user_wait", 5)
        self.browser.find_by_xpath("//div[@class='token-input-dropdown']//li[@class='token-input-dropdown-item2 token-input-selected-dropdown-item']/b").first.click()
        self.browser.find_by_value('Save Bob\'s type').first.click()
        self.browser.find_link_by_href('/graphs/bobs-graph/').first.click()
        self.browser.find_by_id('visualization-type').first.click()
        self.browser.find_by_id('visualization-sigma').first.click()
        text = self.browser.find_by_xpath("//div[@class='flags-block']/span[@class='graph-relationships']").first.value
        self.assertEqual(text, "1 relationships")
        # Delete the relationship
        self.browser.find_by_id('dataMenu').first.click()
        self.browser.find_by_xpath("//td[@class='dataActions']/a[@class='dataOption list']").first.click()
        self.browser.find_by_xpath("//td[@class='dataList']/a[@class='edit']").first.click()
        #import ipdb; ipdb.set_trace();
        self.browser.find_by_xpath("//span[@class='all-relationships outgoing-relationships o_bobs_rel1_1-relationships']//a[@class='delete-row initial-form floating']").first.click()
        self.browser.find_by_value('Save Bob\'s type').first.click()
        self.browser.find_link_by_href('/graphs/bobs-graph/').first.click()
        self.browser.find_by_id('visualization-type').first.click()
        self.browser.find_by_id('visualization-sigma').first.click()
        text = self.browser.find_by_xpath("//div[@class='flags-block']/span[@class='graph-relationships']").first.value
        self.assertEqual(text, "0 relationships")

    def test_graph_export_gexf(self):
        create_graph(self)
        create_schema(self)
        create_type(self)
        create_data(self)
        self.browser.find_by_id('toolsMenu').first.click()
        cookies = {self.browser.cookies.all()[0]["name"]: self.browser.cookies.all()[0]["value"], self.browser.cookies.all()[1]["name"]: self.browser.cookies.all()[1]["value"]}
        result = requests.get(self.live_server_url + '/tools/bobs-graph/export/gexf/', cookies=cookies)
        self.assertEqual(result.headers['content-type'], 'application/xml')
        self.assertEqual(self.browser.status_code.is_success(), True)
        f = open('sylva/base/tests/files/bobs-graph.gexf')
        xmlFile = ""
        for line in f:
            xmlFile += line
        f.close()
        self.assertEqual(xmlFile, result.content + "\n")

    def test_graph_export_csv(self):
        create_graph(self)
        create_schema(self)
        create_type(self)
        create_data(self)
        self.browser.find_by_id('toolsMenu').first.click()
        cookies = {self.browser.cookies.all()[0]["name"]: self.browser.cookies.all()[0]["value"], self.browser.cookies.all()[1]["name"]: self.browser.cookies.all()[1]["value"]}
        result = requests.get(self.live_server_url + '/tools/bobs-graph/export/csv/', cookies=cookies)
        self.assertEqual(result.headers['content-type'], 'application/zip')
        self.assertEqual(self.browser.status_code.is_success(), True)
        test_file = StringIO(result.content)
        csv_zip = ZipFile(test_file)
        for name in csv_zip.namelist():
            f = open('sylva/base/tests/files/' + name)
            csvFile = ""
            for line in f:
                csvFile += line
            f.close()
            self.assertEqual(csv_zip.read(name), csvFile)

    def test_node_type_deletion_keeping_nodes(self):
        create_graph(self)
        create_schema(self)
        create_type(self)
        # Adding relationship to the type
        self.browser.find_by_id('allowedRelations').first.click()
        self.browser.select('source', '1')
        self.browser.find_by_name('name').fill("Bob's rel")
        self.browser.select('target', '1')
        self.browser.find_by_id('id_description').fill(
            'The loved relationship')
        self.browser.find_by_value('Save Type').first.click()
        text = self.browser.find_by_xpath(
            "//div[@class='form-row indent']/label").first.value
        self.assertNotEqual(text.find("Bob's rel"), -1)
        # Creating nodes
        create_node(self, 'Bob')
        create_node(self, 'Alice')
        # Creating relationship between nodes
        self.browser.find_by_id('dataMenu').first.click()
        self.browser.find_by_xpath("//td[@class='dataActions']/a[@class='dataOption list']").first.click()
        self.browser.find_by_xpath("//td[@class='dataList']/a[@class='edit']").first.click()
        self.browser.find_by_xpath("//li[@class='token-input-input-token']/input").first.fill('Alice')
        self.browser.is_element_present_by_id("id_user_wait", wait_time=5)
        self.browser.find_by_xpath("//div[@class='token-input-dropdown']//li[@class='token-input-dropdown-item2 token-input-selected-dropdown-item']/b").first.click()
        self.browser.find_by_value('Save Bob\'s type').first.click()
        self.browser.find_link_by_href('/graphs/bobs-graph/').first.click()
        text = self.browser.find_by_xpath("//div[@class='flags-block']/span[@class='graph-relationships']").first.value
        self.assertEqual(text, "1 relationships")
        # Deleting type
        self.browser.find_link_by_href('/schemas/bobs-graph/').first.click()
        self.browser.find_by_xpath("//fieldset[@class='module aligned wide model']/h2/a").first.click()
        self.browser.find_by_xpath("//span[@class='buttonLinkOption buttonLinkRight']/a[@class='delete']").first.click()
        text = self.browser.find_by_xpath(
            "//p/label[@for='id_option_0']").first.value
        self.assertNotEqual(text.find(
            "We found some elements of this type"), -1)
        # Keeping nodes
        self.browser.choose('option', 'no')
        self.browser.find_by_value('Continue').first.click()
        text = self.browser.find_by_xpath(
            "//div[@class='body-inside']/p").first.value
        self.assertEqual(text, 'There are no types defined yet.')
        # Checking
        self.browser.find_link_by_href('/graphs/bobs-graph/').first.click()
        text = self.browser.find_by_xpath("//div[@class='flags-block']/span[@class='graph-nodes']").first.value
        self.assertEqual(text, "2 nodes")
        text = self.browser.find_by_xpath("//div[@class='flags-block']/span[@class='graph-relationships']").first.value
        self.assertEqual(text, "1 relationships")
        self.browser.find_by_id('visualization-type').first.click()
        self.browser.find_by_id('visualization-sigma').first.click()
        js_code = '''
            var instanceId = '0';
            for (key in sigma.instances) {
                instanceId = key;
                break;
            }
            var instance = sigma.instances[instanceId];
            sigma.test_node_count = instance.getNodesCount();
            '''
        self.browser.execute_script(js_code)
        text = self.browser.evaluate_script('sigma.test_node_count')
        self.assertEqual(text, 0)

    def test_node_type_deletion_deleting_nodes(self):
        create_graph(self)
        create_schema(self)
        create_type(self)
        # Adding relationship to the type
        self.browser.find_by_id('allowedRelations').first.click()
        self.browser.select('source', '1')
        self.browser.find_by_name('name').fill("Bob's rel")
        self.browser.select('target', '1')
        self.browser.find_by_id('id_description').fill(
            'The loved relationship')
        self.browser.find_by_value('Save Type').first.click()
        text = self.browser.find_by_xpath(
            "//div[@class='form-row indent']/label").first.value
        self.assertNotEqual(text.find("Bob's rel"), -1)
        # Creating nodes
        create_node(self, 'Bob')
        create_node(self, 'Alice')
        # Creating relationship between nodes
        self.browser.find_by_id('dataMenu').first.click()
        self.browser.find_by_xpath("//td[@class='dataActions']/a[@class='dataOption list']").first.click()
        self.browser.find_by_xpath("//td[@class='dataList']/a[@class='edit']").first.click()
        self.browser.find_by_xpath("//li[@class='token-input-input-token']/input").first.fill('Alice')
        self.browser.is_element_present_by_id("id_user_wait", wait_time=5)
        self.browser.find_by_xpath("//div[@class='token-input-dropdown']//li[@class='token-input-dropdown-item2 token-input-selected-dropdown-item']/b").first.click()
        self.browser.find_by_value('Save Bob\'s type').first.click()
        self.browser.find_link_by_href('/graphs/bobs-graph/').first.click()
        text = self.browser.find_by_xpath("//div[@class='flags-block']/span[@class='graph-relationships']").first.value
        self.assertEqual(text, "1 relationships")
        # Deleting type
        self.browser.find_link_by_href('/schemas/bobs-graph/').first.click()
        self.browser.find_by_xpath("//fieldset[@class='module aligned wide model']/h2/a").first.click()
        self.browser.find_by_xpath("//span[@class='buttonLinkOption buttonLinkRight']/a[@class='delete']").first.click()
        text = self.browser.find_by_xpath(
            "//p/label[@for='id_option_0']").first.value
        self.assertNotEqual(text.find(
            "We found some elements of this type"), -1)
        # Deleting nodes
        self.browser.choose('option', 'de')
        self.browser.find_by_value('Continue').first.click()
        text = self.browser.find_by_xpath(
            "//div[@class='body-inside']/p").first.value
        self.assertEqual(text, 'There are no types defined yet.')
        # Checking
        self.browser.find_link_by_href('/graphs/bobs-graph/').first.click()
        text = self.browser.find_by_xpath("//div[@class='flags-block']/span[@class='graph-nodes']").first.value
        self.assertEqual(text, "0 nodes")
        text = self.browser.find_by_xpath("//div[@class='flags-block']/span[@class='graph-relationships']").first.value
        self.assertEqual(text, "0 relationships")
