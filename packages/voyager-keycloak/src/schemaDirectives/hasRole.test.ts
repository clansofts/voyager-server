import test from 'ava'

import { GraphQLSchema } from 'graphql'
import { VisitableSchemaType } from 'graphql-tools/dist/schemaVisitor'
import { HasRoleDirective } from './hasRole'

import {KeycloakAuthContextProvider} from '../AuthContextProvider'

const createHasRoleDirective = (directiveArgs: any) => {
  return new HasRoleDirective({
    name: 'testHasRoleDirective',
    args: directiveArgs,
    visitedType: ({} as VisitableSchemaType),
    schema: ({} as GraphQLSchema),
    context: []
  })
}

test('context.auth.hasRole() is called', async (t) => {
  t.plan(3)
  const directiveArgs = {
    role: 'admin'
  }

  const directive = createHasRoleDirective(directiveArgs)

  const field = {
    resolve: (root: any, args: any, context: any, info: any) => {
      t.pass()
    },
    name: 'testField'
  }

  directive.visitFieldDefinition(field)

  const root = {}
  const args = {}
  const req = {
    kauth: {
      grant: {
        access_token: {
          hasRole: (role: string) => {
            t.pass()
            t.deepEqual(role, directiveArgs.role)
            return true
          }
        }
      }
    }
  }
  const context = {
    request: req,
    auth: new KeycloakAuthContextProvider({ req })
  }

  const info = {
    parentType: {
      name: 'testParent'
    }
  }

  await field.resolve(root, args, context, info)
})

test('visitFieldDefinition accepts an array of roles', async (t) => {
  t.plan(4)
  const directiveArgs = {
    role: ['foo', 'bar', 'baz']
  }

  const directive = createHasRoleDirective(directiveArgs)

  const field = {
    resolve: (root: any, args: any, context: any, info: any) => {
      t.pass()
    },
    name: 'testField'
  }

  directive.visitFieldDefinition(field)

  const root = {}
  const args = {}
  const req = {
    kauth: {
      grant: {
        access_token: {
          hasRole: (role: string) => {
            t.log(`checking has role ${role}`)
            t.pass()
            return (role === 'baz') // this makes sure it doesn't return true instantly
          }
        }
      }
    }
  }
  const context = {
    request: req,
    auth: new KeycloakAuthContextProvider({ req })
  }

  const info = {
    parentType: {
      name: 'testParent'
    }
  }

  await field.resolve(root, args, context, info)
})

test('if there is no authentication, then an error is returned and the original resolver will not execute', async (t) => {
  const directiveArgs = {
    role: 'admin'
  }

  const directive = createHasRoleDirective(directiveArgs)

  const field = {
    resolve: (root: any, args: any, context: any, info: any) => {
      return new Promise((resolve, reject) => {
        t.fail('the original resolver should never be called when an auth error is thrown')
        return reject(new Error('the original resolver should never be called when an auth error is thrown'))
      })
    },
    name: 'testField'
  }

  directive.visitFieldDefinition(field)

  const root = {}
  const args = {}
  const req = {}
  const context = {
    request: req,
    auth: new KeycloakAuthContextProvider({ req })
  }

  const info = {
    parentType: {
      name: 'testParent'
    }
  }

  await t.throwsAsync(async () => {
    await field.resolve(root, args, context, info)
  }, `Unable to find authentication. Authorization is required for field ${field.name} on parent ${info.parentType.name}. Must have one of the following roles: [${directiveArgs.role}]`)
})

test('if token does not have the required role, then an error is returned and the original resolver will not execute', async (t) => {
  const directiveArgs = {
    role: 'admin'
  }

  const directive = createHasRoleDirective(directiveArgs)

  const field = {
    resolve: (root: any, args: any, context: any, info: any) => {
      return new Promise((resolve, reject) => {
        t.fail('the original resolver should never be called when an auth error is thrown')
        return reject(new Error('the original resolver should never be called when an auth error is thrown'))
      })
    },
    name: 'testField'
  }

  directive.visitFieldDefinition(field)

  const root = {}
  const args = {}
  const req = {
    kauth: {
      grant: {
        access_token: {
          hasRole: (role: string) => {
            t.deepEqual(role, directiveArgs.role)
            return false
          }
        }
      }
    }
  }
  const context = {
    request: req,
    auth: new KeycloakAuthContextProvider({ req })
  }

  const info = {
    parentType: {
      name: 'testParent'
    }
  }

  await t.throwsAsync(async () => {
    await field.resolve(root, args, context, info)
  }, `user is not authorized for field ${field.name} on parent ${info.parentType.name}. Must have one of the following roles: [${directiveArgs.role}]`)
})

test('if hasRole arguments are invalid, visitSchemaDirective does not throw, but field.resolve will return a generic error to the user and original resolver will not be called', async (t) => {
  const directiveArgs = {
    role: 'admin',
    some: 'unknown arg'
  }

  const directive = createHasRoleDirective(directiveArgs)

  const field = {
    resolve: (root: any, args: any, context: any, info: any) => {
      return new Promise((resolve, reject) => {
        t.fail('the original resolver should never be called when an auth error is thrown')
        return reject(new Error('the original resolver should never be called when an auth error is thrown'))
      })
    },
    name: 'testField'
  }

  t.throws(() => {
    directive.visitFieldDefinition(field)
  })
})
