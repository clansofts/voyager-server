# Displaying metrics and exploring audit logs

## Prerequisites

* Audit logging is enabled in Voyager server and also in the clients
* OpenShift logging is enabled

## Importing Kibana saved objects

A template for Kibana saved objects is available. When it is imported, a number of saved searches, visualizations and a
dashboard is created in Kibana.

OpenShift logging creates ElasticSearch indices per namespace and the index names have the format `project.<project-name>.<project-uid>`.
For example `project.myproject.49f9a0b6-09b5-11e9-9597-069f7827c758`.

It also creates a Kibana index pattern for that index using the pattern `project.<project-name>.<project-uid>.*`.

In order to make sure the Kibana saved objects use the correct index pattern, project UID should be fetched and
fed to the Kibana import template.  

```bash
PROJECT_NAME=<your_project_name>
# login with your user that has access to your project
oc login
# get project UUID, which is used to build the index name
PROJECT_UUID=`oc get project $PROJECT_NAME -o go-template='{{.metadata.uid}}'`

# replace the placeholders in the template
sed \
    -e "s/<PROJECT_NAME>/${PROJECT_NAME}/g" \
    -e "s/<PROJECT_UUID>/${PROJECT_UUID}/g" \
 kibanaImportTemplate.json > kibanaImport.json
```

You may find out `kibanaImportTemplate.json` [here](./kibanaImportTemplate.json).

Once the `kibanaImport.json` file is generated, it has to be imported into Kibana. 

To do that:
* Open Kibana (URL: <YOUR OPENSHIFT URL>/app/kibana)
* Click *Management* in the left
* Click *Saved Objects*
* Click *Import* and select `kibanaImport.json`

Imported saved objects have ids and names that have the project name or the UID in them. So, they may be created for each
namespace without affecting each other.

### Notes

No index pattern is created in Kibana if there is no logs generated by an application.
Also, if the fields referenced in the prepared Kibana saved objects do not exist, errors such as the following can be seen:

```
Error: Importing AeroGear Data Sync - top level execution per platform - aaa (top_level_execution_per_platform_49f9a0b6-09b5-11e9-9597-069f7827c758) failed: Could not locate that index-pattern-field (id: audit.clientInfo.data.device.platform.raw)
Error: Could not locate that index-pattern-field (id: audit.clientInfo.data.device.platform.raw)
``` 

Because of these conditions, Kibana saved objects have to be imported after there is some audit logs are already in ElasticSearch.
At the moment, no mechanisms provided to overcome this problem.

## Viewing the dashboard and audit logs

When the Kibana saved objects are imported, a dashboard will be available with lots of different visualizations.

That can be used as an overview of the sync service status.

At the bottom of the dashboard, audit log messages can be explored directly.

For more information on how to use Kibana, please consult [Kibana documentation](https://www.elastic.co/products/kibana).   